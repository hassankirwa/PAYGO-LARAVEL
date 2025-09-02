const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Currency utility functions for KSh (no conversion needed)
export const formatKshPrice = (kshAmount: number): string => {
  return `KSh ${Math.round(kshAmount).toLocaleString()}`;
};

export const formatKshPriceWithDecimals = (kshAmount: number): string => {
  return `KSh ${kshAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// API client configuration
const apiClient = {
  get: async (endpoint: string, params?: Record<string, any>) => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  post: async (endpoint: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },
};

// Product-related types
export interface ProductCategory {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

// Laravel Product interface (from API response)
interface LaravelProduct {
  id: number;
  category_id: number;
  name: string;
  model_code: string;
  description_text?: string;
  long_description?: string;
  capacity_litres?: number;
  power_consumption_watts?: number;
  color?: string;
  defrost_type: 'Manual' | 'Automatic';
  cash_warranty_months: number;
  paygo_warranty_months: number;
  price_ksh: string | number; // Changed from price_usd
  weekly_installment_ksh: string | number; // Changed from weekly_installment_usd
  monthly_installment_ksh: string | number; // Changed from monthly_installment_usd
  features: string | string[];
  images: string | string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
}

// Frontend Product interface (after conversion)
export interface Product {
  id: number;
  category_id: number;
  name: string;
  model_code: string;
  description_text?: string;
  long_description?: string;
  capacity_litres?: number;
  power_consumption_watts?: number;
  color?: string;
  defrost_type: 'Manual' | 'Automatic';
  cash_warranty_months: number;
  paygo_warranty_months: number;
  price_ksh: number; // Changed from price_usd
  weekly_installment_ksh: number; // Changed from weekly_installment_usd
  monthly_installment_ksh?: number; // Changed from monthly_installment_usd
  features?: string[];
  images?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  min_capacity?: number;
  max_capacity?: number;
  color?: string;
  sort_by?: 'name' | 'price_ksh' | 'capacity_litres' | 'weekly_installment_ksh' | 'created_at';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  filters: {
    categories: ProductCategory[];
    price_range: {
      min: number;
      max: number;
    };
    capacity_range: {
      min: number;
      max: number;
    };
    colors: string[];
  };
}

export interface AvailabilityCheck {
  location: string;
  postal_code?: string;
}

export interface AvailabilityResponse {
  available: boolean;
  estimated_delivery_days: number;
  delivery_cost_usd: number;
  installation_available: boolean;
  installation_cost_usd: number;
  nearest_service_center: {
    name: string;
    address: string;
    phone: string;
    distance_km: number;
  };
}

// Product API functions
export const productApi = {
  // Get all products with filters and pagination
  getProducts: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const response = await apiClient.get('/products', filters);
    if (response.success && response.data?.data) {
      response.data.data = response.data.data.map((product: LaravelProduct) => convertLaravelProduct(product));
    }
    return response;
  },

  // Get single product by ID
  getProduct: async (productId: number): Promise<{ success: boolean; data: Product }> => {
    const response = await apiClient.get(`/products/${productId}`);
    if (response.success && response.data) {
      response.data = convertLaravelProduct(response.data);
    }
    return response;
  },

  // Get product categories
  getCategories: async (): Promise<{ success: boolean; data: ProductCategory[] }> => {
    return apiClient.get('/products/categories');
  },

  // Get featured products
  getFeaturedProducts: async (): Promise<{ success: boolean; data: Product[] }> => {
    return apiClient.get('/products/featured');
  },

  // Check product availability
  checkAvailability: async (productId: number, data: AvailabilityCheck): Promise<{ success: boolean; data: AvailabilityResponse }> => {
    return apiClient.post(`/products/${productId}/check-availability`, data);
  },
};

// Helper functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const formatCapacity = (capacity: number): string => {
  return `${capacity}L`;
};

export const formatPowerConsumption = (watts: number): string => {
  return `${watts}W`;
};

export const formatWarranty = (months: number): string => {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
  } else {
    return `${months} month${months > 1 ? 's' : ''}`;
  }
};

// Convert Laravel product format to frontend format
export const convertLaravelProduct = (laravelProduct: LaravelProduct): Product => {
  // Ensure features is always an array
  const ensureArray = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Ensure images is always an array
  const ensureImageArray = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  return {
    id: laravelProduct.id,
    name: laravelProduct.name,
    description_text: laravelProduct.description_text,
    long_description: laravelProduct.long_description,
    category_id: laravelProduct.category_id,
    category: laravelProduct.category,
    model_code: laravelProduct.model_code,
    capacity_litres: laravelProduct.capacity_litres,
    power_consumption_watts: laravelProduct.power_consumption_watts,
    color: laravelProduct.color,
    defrost_type: laravelProduct.defrost_type,
    cash_warranty_months: laravelProduct.cash_warranty_months,
    paygo_warranty_months: laravelProduct.paygo_warranty_months,
    price_ksh: Number(laravelProduct.price_ksh),
    weekly_installment_ksh: Number(laravelProduct.weekly_installment_ksh),
    monthly_installment_ksh: Number(laravelProduct.monthly_installment_ksh || 0),
    features: ensureArray(laravelProduct.features),
    images: ensureImageArray(laravelProduct.images),
    is_active: laravelProduct.is_active,
    created_at: laravelProduct.created_at,
    updated_at: laravelProduct.updated_at,
  };
};

// PayGo Plan Types
export interface PayGoPlan {
  product_id: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  duration_months: number;
  base_price: number;
  down_payment: number;
  financing_amount: number;
  installment_amount: number;
  total_installments: number;
  total_installment_cost: number;
  total_cost: number;
  total_interest: number;
  interest_rate_annual: number;
  savings_vs_cash: number;
  payment_schedule: PaymentScheduleItem[];
  grace_period_days: number;
  late_fee_percentage: number;
  early_payment_discount: number;
}

export interface PaymentScheduleItem {
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface PayGoPlanResponse {
  success: boolean;
  data: {
    product: {
      id: number;
      name: string;
      model_code: string;
      price_ksh: string;
    };
    available_plans: PayGoPlan[];
    plan_summary: {
      total_plans: number;
      frequencies: string[];
      durations: number[] | { [key: string]: number };
      lowest_installment: number;
      highest_installment: number;
    };
  };
}

export interface CustomPlanRequest {
  frequency: 'weekly' | 'monthly' | 'quarterly';
  duration_months: number;
  down_payment: number;
}

export interface CustomPlanResponse {
  success: boolean;
  data: {
    product: {
      id: number;
      name: string;
      price_ksh: string;
    };
    custom_plan: PayGoPlan;
  };
}

export interface PlanComparison {
  success: boolean;
  data: {
    product: {
      id: number;
      name: string;
      price_ksh: string;
    };
    comparison: {
      lowest_installment: PayGoPlan;
      plans: PayGoPlan[];
      comparison_matrix: {
        frequency: string;
        duration: number;
        installment: number;
        total_cost: number;
        total_installments: number;
        installment_vs_lowest: number;
      }[];
    };
  };
}

export interface BudgetRecommendations {
  success: boolean;
  data: {
    product: {
      id: number;
      name: string;
      price_ksh: string;
    };
    budget_constraints: {
      max_installment: number;
      preferred_frequency: string;
    };
    recommendations: {
      affordable_plans: PayGoPlan[];
      recommended: PayGoPlan | null;
      budget_analysis: {
        max_installment: number;
        plans_available: number;
        lowest_installment: number | null;
      };
    };
  };
}

export interface PayGoSettings {
  success: boolean;
  data: {
    available_durations: number[];
    available_frequencies: string[];
    down_payment_constraints: {
      min_percentage: number;
      max_percentage: number;
    };
    payment_terms: {
      grace_period_days: number;
      late_fee_percentage: number;
      early_payment_discount: number;
      interest_rate: number;
    };
  };
}

// PayGo Plan API functions
export const paygoApi = {
  // Get PayGo settings and constraints
  getSettings: async (): Promise<PayGoSettings> => {
    return apiClient.get('/paygo-plans/settings');
  },

  // Get all available plans for a product
  getPlansForProduct: async (productId: number, downPayment?: number): Promise<PayGoPlanResponse> => {
    const params = downPayment ? { down_payment: downPayment } : undefined;
    return apiClient.get(`/products/${productId}/paygo-plans`, params);
  },

  // Calculate custom plan
  calculateCustomPlan: async (productId: number, planData: CustomPlanRequest): Promise<CustomPlanResponse> => {
    return apiClient.post(`/products/${productId}/paygo-plans/calculate`, planData);
  },

  // Compare multiple plans
  comparePlans: async (productId: number, plans: CustomPlanRequest[]): Promise<PlanComparison> => {
    return apiClient.post(`/products/${productId}/paygo-plans/compare`, { plans });
  },

  // Get budget-based recommendations
  getRecommendations: async (productId: number, maxInstallment: number, preferredFrequency?: 'weekly' | 'monthly' | 'quarterly'): Promise<BudgetRecommendations> => {
    return apiClient.post(`/products/${productId}/paygo-plans/recommendations`, {
      max_installment: maxInstallment,
      preferred_frequency: preferredFrequency || 'monthly'
    });
  },

  // Get payment schedule for a plan
  getPaymentSchedule: async (productId: number, planData: CustomPlanRequest) => {
    return apiClient.post(`/products/${productId}/paygo-plans/schedule`, planData);
  },

  // Validate plan parameters
  validateParameters: async (params: {
    base_price: number;
    frequency: 'weekly' | 'monthly' | 'quarterly';
    duration_months: number;
    down_payment: number;
  }) => {
    return apiClient.post('/paygo-plans/validate', params);
  },
};

// PayGo plan helper functions
export const formatInstallment = (amount: number, frequency: string): string => {
  const formatted = formatKshPrice(amount);
  return `${formatted}/${frequency === 'weekly' ? 'week' : frequency === 'monthly' ? 'month' : 'quarter'}`;
};

export const formatDuration = (months: number): string => {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${years}y ${remainingMonths}m`;
    }
  } else {
    return `${months} month${months > 1 ? 's' : ''}`;
  }
};

export const formatFrequency = (frequency: string): string => {
  return frequency.charAt(0).toUpperCase() + frequency.slice(1);
};

export const calculateDownPaymentRange = (price: number, minPercentage: number, maxPercentage: number) => {
  return {
    min: price * (minPercentage / 100),
    max: price * (maxPercentage / 100),
  };
}; 

// PayBill Transaction Types
export interface PaybillTransaction {
  id: number;
  trans_id: string;
  device_id: string;
  trans_amount: number;
  formatted_amount: string;
  customer_name: string;
  phone: string;
  status: 'pending' | 'validated' | 'validated_pending_confirmation' | 'processed' | 'failed' | 'rejected';
  amount_matched: boolean;
  credited_to_account: boolean;
  payment_type: 'down_payment' | 'installment' | 'advance_payment' | 'late_payment';
  processing_notes?: string;
  processed_at?: string;
  processed_by?: string;
  expected_amount?: number;
  created_at: string;
  updated_at: string;
  trans_time: string;
  client_id?: number;
  appliance_id?: number;
  payment_order_id?: number;
  payment_plan_id?: number;
  mpesa_receipt_number?: string; // Added missing field
}

export interface PaybillInfo {
  paybill_number: string;
  business_name: string;
  account_reference_format: string;
  minimum_amount: number;
  maximum_amount: number;
  instructions: string[];
}

export interface PaybillTransactionSummary {
  total_transactions: number;
  total_amount: number;
  formatted_total_amount: string;
  processed_transactions: number;
  processed_amount: number;
  formatted_processed_amount: string;
  pending_transactions: number;
  pending_amount: number;
  formatted_pending_amount: string;
  failed_transactions: number;
  failed_amount: number;
  formatted_failed_amount: string;
  recent_transactions: PaybillTransaction[];
}

export interface PaybillStatus {
  device_id: string;
  monitoring_active: boolean;
  latest_payment?: PaybillTransaction;
}

export interface PaybillTransactionsResponse {
  success: boolean;
  data: {
    transactions: PaybillTransaction[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
  };
}

export interface PaybillAnalytics {
  success: boolean;
  data: {
    summary: {
      total_transactions: number;
      total_amount: number;
      success_rate: number;
      average_transaction_amount: number;
    };
    daily_stats: Array<{
      date: string;
      transactions: number;
      amount: number;
      success_rate: number;
    }>;
    payment_types: Array<{
      type: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
    status_breakdown: Array<{
      status: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
  };
}

// PayBill API functions
// Receipt API functions
export const receiptApi = {
  // Get customer receipts (existing - for search by phone/email)
  getCustomerReceipts: async (phone?: string, email?: string) => {
    try {
      const params = new URLSearchParams()
      if (phone) params.append('phone', phone)
      if (email) params.append('email', email)
      
      const response = await fetch(`${API_BASE_URL}/receipts?${params}`)
      const data = await response.json()
      
      return data
    } catch (error) {
      console.error('Failed to get customer receipts:', error)
      return { success: false, error: 'Failed to load receipts' }
    }
  },

  // NEW: Get receipts for authenticated client
  getClientReceipts: async (params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
  }) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        return { success: false, error: 'Authentication required' }
      }

      const urlParams = new URLSearchParams()
      if (params?.page) urlParams.append('page', params.page.toString())
      if (params?.per_page) urlParams.append('per_page', params.per_page.toString())
      if (params?.sort_by) urlParams.append('sort_by', params.sort_by)
      if (params?.sort_direction) urlParams.append('sort_direction', params.sort_direction)

      const response = await fetch(`${API_BASE_URL}/client/receipts?${urlParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to get client receipts:', error)
      return { success: false, error: 'Failed to load your receipts' }
    }
  },

  // Get receipt by receipt number
  getReceipt: async (receiptNumber: string) => {
    return apiClient.get(`/receipts/${receiptNumber}`);
  },

  // Download receipt
  downloadReceipt: async (receiptNumber: string) => {
    return apiClient.get(`/receipts/${receiptNumber}/download`);
  },

  // Preview receipt PDF
  previewReceipt: async (receiptNumber: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/receipts/${receiptNumber}/preview`)
      
      if (response.ok) {
        // Get the PDF blob
        const blob = await response.blob()
        
        // Create URL for PDF viewer
        const url = window.URL.createObjectURL(blob)
        
        // Open in new tab/window
        window.open(url, '_blank')
        
        return { success: true, message: 'Receipt opened for preview' }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error || 'Failed to preview receipt' }
      }
    } catch (error) {
      console.error('Failed to preview receipt:', error)
      return { success: false, error: 'Failed to preview receipt' }
    }
  },

  // Get all receipts for admin (with pagination and filtering)
  getAllReceipts: async (params?: {
    page?: number
    per_page?: number
    search?: string
    status?: string
    payment_type?: string
    sort_by?: string
    sort_direction?: 'asc' | 'desc'
  }) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        return { success: false, error: 'Authentication required' }
      }

      const urlParams = new URLSearchParams()
      if (params?.page) urlParams.append('page', params.page.toString())
      if (params?.per_page) urlParams.append('per_page', params.per_page.toString())
      if (params?.search) urlParams.append('search', params.search)
      if (params?.status && params.status !== 'all') urlParams.append('status', params.status)
      if (params?.payment_type && params.payment_type !== 'all') urlParams.append('payment_type', params.payment_type)
      if (params?.sort_by) urlParams.append('sort_by', params.sort_by)
      if (params?.sort_direction) urlParams.append('sort_direction', params.sort_direction)

      const response = await fetch(`${API_BASE_URL}/admin/receipts?${urlParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to get all receipts:', error)
      return { success: false, error: 'Failed to load receipts' }
    }
  },

  // NEW: Update receipt status (admin)
  updateReceiptStatus: async (receiptNumber: string, status: string, notes?: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        return { success: false, error: 'Authentication required' }
      }

      const response = await fetch(`${API_BASE_URL}/admin/receipts/${receiptNumber}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes: notes || undefined
        })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to update receipt status:', error)
      return { success: false, error: 'Failed to update receipt status' }
    }
  },

  // NEW: Bulk update receipt statuses (admin)
  bulkUpdateStatus: async (receiptNumbers: string[], status: string, notes?: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        return { success: false, error: 'Authentication required' }
      }

      const response = await fetch(`${API_BASE_URL}/admin/receipts/bulk-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receipt_numbers: receiptNumbers,
          status,
          notes: notes || undefined
        })
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to bulk update receipt statuses:', error)
      return { success: false, error: 'Failed to bulk update receipt statuses' }
    }
  },
};

// Payment Services API functions
export const paymentServicesApi = {
  // Check payment order status including receipt and plan activation
  checkPaymentOrderStatus: async (orderReference: string) => {
    return apiClient.get(`/payment-orders/${orderReference}/status`);
  },

  // Get plan activation status
  getPlanActivationStatus: async (orderReference: string) => {
    return apiClient.get(`/payment-orders/${orderReference}/plan-status`);
  },

  // Get SMS notification status
  getSmsNotificationStatus: async (orderReference: string) => {
    return apiClient.get(`/payment-orders/${orderReference}/sms-status`);
  },
};

export const paybillApi = {

  // Check payment status for a specific device (dashboard use - requires auth)
  checkPaymentStatus: async (deviceId: string): Promise<{ success: boolean; data: PaybillStatus }> => {
    return apiClient.get(`/client/paybill-transactions?device_id=${deviceId}&limit=1`);
  },

  // Get live transaction status by transaction ID
  getLiveTransactionStatus: async (transactionId: string): Promise<{ success: boolean; data: PaybillTransaction }> => {
    return apiClient.get(`/client/paybill-transactions/${transactionId}`);
  },

  // Poll for transaction status updates for dashboard (client-specific)
  pollTransactionStatus: async (clientId: number, params?: {
    device_id?: string;
    since?: string;
    status?: string;
  }): Promise<{ success: boolean; data: { transactions: PaybillTransaction[] } }> => {
    return apiClient.get(`/client/paybill-transactions`, params);
  },

  // Get client's PayBill transactions (protected endpoint)
  getTransactions: async (params?: {
    status?: string;
    payment_type?: string;
    days?: string;
    page?: number;
    per_page?: number;
  }, token?: string): Promise<PaybillTransactionsResponse> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = new URL(`${API_BASE_URL}/client/paybill-transactions`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },



  // Get specific transaction details (protected endpoint)
  getTransactionDetail: async (transactionId: number, token?: string): Promise<{ success: boolean; data: PaybillTransaction }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/client/paybill-transactions/${transactionId}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get transaction summary for client dashboard
  getTransactionSummary: async (params?: {
    status?: string;
    payment_type?: string;
    days?: string;
  }, token?: string): Promise<{ success: boolean; data: PaybillTransactionSummary }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = new URL(`${API_BASE_URL}/client/paybill-transactions/summary`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get PayBill analytics (admin endpoint)
  getAnalytics: async (params?: {
    days?: string;
    client_id?: number;
  }, token?: string): Promise<PaybillAnalytics> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = new URL(`${API_BASE_URL}/paybill/analytics`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Simulate PayBill payment (testing endpoint)
  simulate: async (data: {
    amount: number;
    device_id: string;
    phone_number: string;
    customer_name?: string;
  }): Promise<{ success: boolean; data: any }> => {
    return apiClient.post('/paybill/simulate', data);
  },

  // Reprocess failed transaction (admin endpoint)
  reprocessTransaction: async (transactionId: number, token?: string): Promise<{ success: boolean; data: PaybillTransaction }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/paybill/reprocess/${transactionId}`, {
      method: 'POST',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Bulk process transactions (admin endpoint)
  bulkProcessTransactions: async (data: {
    transaction_ids: number[];
    action: 'process' | 'reject' | 'reprocess';
    notes?: string;
  }, token?: string): Promise<{ success: boolean; data: { processed: number; failed: number; results: any[] } }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/paybill/bulk-process`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get verification status for a transaction
  getVerificationStatus: async (transactionId: string): Promise<{ success: boolean; data: any }> => {
    return apiClient.get(`/paybill/verification-status/${transactionId}`);
  },

  // Verify payment manually (admin endpoint)
  verifyPayment: async (transactionId: string, token?: string): Promise<{ success: boolean; data: any }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/paybill/verify-payment/${transactionId}`, {
      method: 'POST',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Client-facing validation endpoint (no auth required)
  validatePayment: async (validationData: {
    TransactionType: string;
    TransID: string;
    TransTime: string;
    TransAmount: string;
    BusinessShortCode: string;
    BillRefNumber: string;
    MSISDN: string;
    FirstName?: string;
    LastName?: string;
  }): Promise<{ ResultCode: number; ResultDesc: string }> => {
    const response = await fetch(`${API_BASE_URL}/client/validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(validationData),
    });
    
    if (!response.ok) {
      throw new Error(`Validation request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Client-facing confirmation endpoint (no auth required)
  confirmPayment: async (confirmationData: {
    TransactionType: string;
    TransID: string;
    TransTime: string;
    TransAmount: string;
    BusinessShortCode: string;
    BillRefNumber: string;
    MSISDN: string;
    FirstName?: string;
    LastName?: string;
  }): Promise<{ ResultCode: number; ResultDesc: string }> => {
    const response = await fetch(`${API_BASE_URL}/client/confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(confirmationData),
    });
    
    if (!response.ok) {
      throw new Error(`Confirmation request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Poll for payment success based on device ID and amount (no auth required)
  pollForPaymentSuccess: async (deviceId: string, expectedAmount: number, maxAttempts: number = 24): Promise<{
    success: boolean;
    transactionId?: string;
    message: string;
  }> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Check if a successful transaction exists for this device and amount
        const response = await fetch(`${API_BASE_URL}/client/validation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            TransactionType: 'Pay Bill',
            TransID: `POLL_${Date.now()}`,
            TransTime: new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, ''),
            TransAmount: expectedAmount.toString(),
            BusinessShortCode: '174379',
            BillRefNumber: deviceId,
            MSISDN: '254700000000',
            FirstName: 'Polling',
            LastName: 'Check'
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.ResultCode === 0) {
            return {
              success: true,
              message: 'Payment successful',
              transactionId: result.TransID || `POLL_${Date.now()}`
            };
          }
        }

        // Wait 10 seconds before next attempt (total 4 minutes for 24 attempts)
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      } catch (error) {
        console.log(`Polling attempt ${attempt} failed:`, error);
        if (attempt === maxAttempts) {
          return {
            success: false,
            message: 'Polling failed after maximum attempts'
          };
        }
      }
    }

    return {
      success: false,
      message: 'Payment not detected within timeout period'
    };
  },

  // Note: Business info comes from static config (same as config/mpesa.php)
  // Note: Payment status uses existing device monitoring pattern
};

// Ongoing Payment API functions
export const ongoingPaymentApi = {
  // Get client's payment plan details
  getPaymentPlanDetails: async () => {
    const response = await fetch(`${API_BASE_URL}/ongoing-payments/plan-details`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment plan details');
    }

    return response.json();
  },

  // Check payment status by reference number
  checkPaymentStatus: async (referenceNumber: string, paymentMethod: string) => {
    const response = await fetch(`${API_BASE_URL}/ongoing-payments/check-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        reference_number: referenceNumber,
        payment_method: paymentMethod
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }

    return response.json();
  },

  // Record manual payment
  recordManualPayment: async (paymentData: {
    payment_method: string;
    amount: number;
    reference_number: string;
    payment_date: string;
    notes?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/ongoing-payments/record-manual`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error('Failed to record payment');
    }

    return response.json();
  },

  // Get payment history
  getPaymentHistory: async (page = 1, perPage = 15, status = 'all') => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      status: status
    });

    const response = await fetch(`${API_BASE_URL}/ongoing-payments/history?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment history');
    }

    return response.json();
  }
};

// PayBill helper functions
export const formatPaybillAmount = (amount: number): string => {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getPaybillStatusColor = (status: string): string => {
  switch (status) {
    case 'processed':
      return 'text-green-600';
    case 'validated':
    case 'validated_pending_confirmation':
      return 'text-blue-600';
    case 'pending':
      return 'text-yellow-600';
    case 'failed':
    case 'rejected':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const getPaybillStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'processed':
      return 'default';
    case 'validated':
    case 'validated_pending_confirmation':
      return 'secondary';
    case 'pending':
      return 'outline';
    case 'failed':
    case 'rejected':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const formatPaybillStatus = (status: string): string => {
  switch (status) {
    case 'validated_pending_confirmation':
      return 'Validated (Pending Confirmation)';
    case 'processed':
      return 'Processed';
    case 'validated':
      return 'Validated';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    case 'rejected':
      return 'Rejected';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const formatPaymentType = (type: string): string => {
  switch (type) {
    case 'down_payment':
      return 'Down Payment';
    case 'installment':
      return 'Installment';
    case 'advance_payment':
      return 'Advance Payment';
    case 'late_payment':
      return 'Late Payment';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

// =======================================================
// CLIENT DASHBOARD API
// =======================================================

// Dashboard interfaces
export interface ClientInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  registration_date: string;
}

export interface DashboardSummary {
  total_subscriptions: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  total_appliances: number;
  total_paid: number;
  formatted_total_paid: string;
  total_balance: number;
  formatted_total_balance: string;
  recent_payments_count: number;
}

export interface DashboardSubscription {
  id: number;
  device_id: string;
  product_name: string;
  status: string;
  subscription_type: string;
  start_date: string;
  end_date: string;
  days_remaining: number | null;
  progress_percentage: number;
  next_payment_amount: number;
  next_payment_due: string;
}

export interface DashboardPayment {
  receipt_number: string;
  amount: number;
  formatted_amount: string;
  date: string;
  status: string;
  method: string;
}

export interface DashboardAppliance {
  id: number;
  device_id: string;
  product_name: string;
  status: string;
  installation_date: string;
  last_ping: string | null;
  temperature: string | null;
  battery_voltage: string | null;
}

export interface DashboardPaymentPlan {
  id: number;
  plan_name: string;
  frequency: string;
  total_amount: number;
  installment_amount: number;
  total_installments: number;
  completed_installments: number;
  progress_percentage: number;
  next_payment_due: string;
  remaining_balance: number;
  status: string;
}

export interface DashboardStats {
  client_info: ClientInfo | null;
  summary: DashboardSummary;
  subscriptions: DashboardSubscription[];
  recent_payments: DashboardPayment[];
  appliances: DashboardAppliance[];
  payment_plans: DashboardPaymentPlan[];
}

export interface MpesaTransactionData {
  id: number;
  receipt_number: string;
  amount: number;
  formatted_amount: string;
  phone_number: string;
  result_code: number;
  result_description: string;
  transaction_date: string;
  payment_date: string;
  status: string;
  is_successful: boolean;
  created_at: string;
  updated_at: string;
}

export interface InternalPaymentData {
  id: number;
  amount: number;
  formatted_amount: string;
  payment_method: string;
  payment_reference: string;
  status: string;
  payment_date: string;
  formatted_date: string;
  notes: string | null;
  created_at: string;
}

export interface PaymentDataResponse {
  mpesa_transactions: MpesaTransactionData[];
  internal_payments: InternalPaymentData[];
}

export interface RenewalOption {
  subscription_id: number;
  device_id: string;
  product_name: string;
  current_status: string;
  subscription_type: string;
  next_payment_amount: number;
  formatted_amount: string;
  next_payment_due: string;
  formatted_due_date: string;
  remaining_balance: number;
  formatted_balance: string;
  payment_method: string;
  can_renew: boolean;
  end_date: string;
  days_remaining: number | null;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  let token = null;
  
  // Use the same key as auth service: 'auth_token'
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('auth_token');
    
    console.log('🔍 Checking for auth token in localStorage...');
    console.log('auth_token:', token ? 'present' : 'missing');
    console.log('user_type:', localStorage.getItem('user_type'));
  }
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'ngrok-skip-browser-warning': 'true'
  };
};

// Dashboard API functions
export const dashboardApi = {
  /**
   * Get comprehensive dashboard statistics
   */
  async getStats(): Promise<{ success: boolean; stats: DashboardStats; timestamp: string }> {
    console.log('🔍 Fetching dashboard stats...');
    
    const response = await fetch(`${API_BASE_URL}/client/dashboard/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Authentication required for dashboard stats');
        throw new Error('Authentication required. Please log in.');
      }
      console.error('❌ Failed to fetch dashboard stats:', response.statusText);
      throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Dashboard stats fetched successfully');
    return data;
  },

  /**
   * Get payment data with M-Pesa transaction details
   */
  async getPayments(): Promise<{ success: boolean; payments: PaymentDataResponse; summary: any }> {
    console.log('🔍 Fetching payment data...');
    
    const response = await fetch(`${API_BASE_URL}/client/dashboard/payments`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Authentication required for payment data');
        throw new Error('Authentication required. Please log in.');
      }
      console.error('❌ Failed to fetch payment data:', response.statusText);
      throw new Error(`Failed to fetch payment data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Payment data fetched successfully');
    return data;
  },

  /**
   * Get subscription renewal options with M-Pesa STK Push
   */
  async getRenewalOptions(): Promise<{ 
    success: boolean; 
    renewal_options: RenewalOption[]; 
    payment_method: string;
    client_phone: string;
    instructions: string;
  }> {
    console.log('🔍 Fetching renewal options...');
    
    const response = await fetch(`${API_BASE_URL}/client/dashboard/renewal-options`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Authentication required for renewal options');
        throw new Error('Authentication required. Please log in.');
      }
      console.error('❌ Failed to fetch renewal options:', response.statusText);
      throw new Error(`Failed to fetch renewal options: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Renewal options fetched successfully');
    return data;
  },
}; 