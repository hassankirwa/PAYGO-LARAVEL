const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Currency utility functions for KSh
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
  price_ksh: string | number;
  weekly_installment_ksh: string | number;
  monthly_installment_ksh: string | number;
  features: string | string[];
  images: string | string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
}

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
  price_ksh: number;
  weekly_installment_ksh: number;
  monthly_installment_ksh?: number;
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
  getProducts: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const response = await apiClient.get('/products', filters);
    if (response.success && response.data?.data) {
      response.data.data = response.data.data.map((product: LaravelProduct) => convertLaravelProduct(product));
    }
    return response;
  },

  getProduct: async (productId: number): Promise<{ success: boolean; data: Product }> => {
    const response = await apiClient.get(`/products/${productId}`);
    if (response.success && response.data) {
      response.data = convertLaravelProduct(response.data);
    }
    return response;
  },

  getCategories: async (): Promise<{ success: boolean; data: ProductCategory[] }> => {
    return apiClient.get('/products/categories');
  },

  getFeaturedProducts: async (): Promise<{ success: boolean; data: Product[] }> => {
    return apiClient.get('/products/featured');
  },

  checkAvailability: async (productId: number, data: AvailabilityCheck): Promise<{ success: boolean; data: AvailabilityResponse }> => {
    return apiClient.post(`/products/${productId}/check-availability`, data);
  },
};

// Convert Laravel product format to frontend format
export const convertLaravelProduct = (laravelProduct: LaravelProduct): Product => {
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
    images: ensureArray(laravelProduct.images),
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
  getSettings: async (): Promise<PayGoSettings> => {
    return apiClient.get('/paygo-plans/settings');
  },

  getPlansForProduct: async (productId: number, downPayment?: number): Promise<PayGoPlanResponse> => {
    const params = downPayment ? { down_payment: downPayment } : undefined;
    return apiClient.get(`/products/${productId}/paygo-plans`, params);
  },

  calculateCustomPlan: async (productId: number, planData: CustomPlanRequest): Promise<CustomPlanResponse> => {
    return apiClient.post(`/products/${productId}/paygo-plans/calculate`, planData);
  },

  comparePlans: async (productId: number, plans: CustomPlanRequest[]): Promise<PlanComparison> => {
    return apiClient.post(`/products/${productId}/paygo-plans/compare`, { plans });
  },

  getRecommendations: async (productId: number, maxInstallment: number, preferredFrequency?: 'weekly' | 'monthly' | 'quarterly'): Promise<BudgetRecommendations> => {
    return apiClient.post(`/products/${productId}/paygo-plans/recommendations`, {
      max_installment: maxInstallment,
      preferred_frequency: preferredFrequency || 'monthly'
    });
  },

  getPaymentSchedule: async (productId: number, planData: CustomPlanRequest) => {
    return apiClient.post(`/products/${productId}/paygo-plans/schedule`, planData);
  },

  validateParameters: async (params: {
    base_price: number;
    frequency: 'weekly' | 'monthly' | 'quarterly';
    duration_months: number;
    down_payment: number;
  }) => {
    return apiClient.post('/paygo-plans/validate', params);
  },
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
  mpesa_receipt_number?: string;
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
export const paybillApi = {
  checkPaymentStatus: async (deviceId: string): Promise<{ success: boolean; data: PaybillStatus }> => {
    return apiClient.get(`/client/paybill-transactions?device_id=${deviceId}&limit=1`);
  },

  getLiveTransactionStatus: async (transactionId: string): Promise<{ success: boolean; data: PaybillTransaction }> => {
    return apiClient.get(`/client/paybill-transactions/${transactionId}`);
  },

  pollTransactionStatus: async (clientId: number, params?: {
    device_id?: string;
    since?: string;
    status?: string;
  }): Promise<{ success: boolean; data: { transactions: PaybillTransaction[] } }> => {
    return apiClient.get(`/client/paybill-transactions`, params);
  },

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

  simulate: async (data: {
    amount: number;
    device_id: string;
    phone_number: string;
    customer_name?: string;
  }): Promise<{ success: boolean; data: any }> => {
    return apiClient.post('/paybill/simulate', data);
  },

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

  getVerificationStatus: async (transactionId: string): Promise<{ success: boolean; data: any }> => {
    return apiClient.get(`/paybill/verification-status/${transactionId}`);
  },

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

  pollForPaymentSuccess: async (deviceId: string, expectedAmount: number, maxAttempts: number = 24): Promise<{
    success: boolean;
    transactionId?: string;
    message: string;
  }> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
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
};

// Subscription-related types
export interface Subscription {
  id: number;
  client_id: number;
  appliance_id: number;
  payment_plan_id?: number;
  activation_payment_id: number;
  device_id: string;
  subscription_type: 'paygo' | 'full_purchase';
  status: 'active' | 'expired' | 'suspended';
  start_date: string;
  end_date: string;
  reactivated_at?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  data: {
    subscription: Subscription;
    appliance: {
      id: number;
      device_id: string;
      product_id: number;
      client_id: number;
      unit_id: string;
      serial_number: string;
      status: string;
      installation_location: string;
      is_active: boolean;
    };
    client: {
      id: number;
      name: string;
      email: string;
      phone: string;
      status: string;
      payment_status: string;
      registration_source: string;
      kyc_status: string;
    };
  };
}

// Subscription API functions
export const subscriptionApi = {
  // Process a payment and create/extend subscription
  processPayment: async (paymentData: {
    customer_phone: string;
    customer_email?: string;
    customer_name: string;
    product_id: number;
    paid_amount: number;
    product_price: number;
    payment_type: 'down_payment' | 'installment' | 'full_payment';
    plan_type?: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly';
    installment_amount?: number;
  }, token: string): Promise<SubscriptionResponse> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/subscriptions/process-payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(`Failed to process payment: ${response.statusText}`);
    }

    return response.json();
  },

  // Get subscription details by device ID
  getSubscriptionByDevice: async (deviceId: string, token: string): Promise<SubscriptionResponse> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/subscriptions/device/${deviceId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.statusText}`);
    }

    return response.json();
  },

  // Check for expired subscriptions
  checkExpiredSubscriptions: async (token: string): Promise<{ success: boolean; data: { count: number } }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/subscriptions/check-expired`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to check expired subscriptions: ${response.statusText}`);
    }

    return response.json();
  },
};

// Helper functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
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