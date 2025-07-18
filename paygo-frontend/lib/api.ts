const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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

// Laravel API Product interface (raw from backend)
export interface LaravelProduct {
  id: number;
  category_id: number;
  name: string;
  model_code: string;
  description_text: string;
  long_description: string;
  capacity_litres: number;
  power_consumption_watts: number;
  color: string;
  defrost_type: 'Manual' | 'Automatic';
  cash_warranty_months: number;
  paygo_warranty_months: number;
  price_usd: string | number;
  weekly_installment_usd: string | number;
  monthly_installment_usd: string | number;
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
  name: string;
  description: string;
  image_url: string;
  category: string;
  categoryId: number;
  categoryObject?: ProductCategory;
  capacity?: string;
  powerConsumption?: string;
  color: string;
  defrostType: 'Manual' | 'Automatic';
  price: number;
  weeklyInstallment: number;
  monthlyInstallment: number;
  features: string[];
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  min_capacity?: number;
  max_capacity?: number;
  color?: string;
  sort_by?: 'name' | 'price_usd' | 'capacity_litres' | 'weekly_installment_usd' | 'created_at';
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

// Convert Laravel product to frontend product format for backward compatibility
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
    description: laravelProduct.description_text,
    image_url: ensureImageArray(laravelProduct.images)[0] || '/placeholder.svg?height=400&width=600',
    category: laravelProduct.category?.name || 'Unknown',
    categoryId: laravelProduct.category_id,
    categoryObject: laravelProduct.category,
    capacity: laravelProduct.capacity_litres ? `${laravelProduct.capacity_litres}L` : undefined,
    powerConsumption: laravelProduct.power_consumption_watts ? `${laravelProduct.power_consumption_watts}W` : undefined,
    color: laravelProduct.color,
    defrostType: laravelProduct.defrost_type,
    price: Number(laravelProduct.price_usd),
    weeklyInstallment: Number(laravelProduct.weekly_installment_usd),
    monthlyInstallment: Number(laravelProduct.monthly_installment_usd),
    features: ensureArray(laravelProduct.features),
    images: ensureImageArray(laravelProduct.images),
    isActive: laravelProduct.is_active,
    createdAt: laravelProduct.created_at,
    updatedAt: laravelProduct.updated_at,
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
      price_usd: string;
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
      price_usd: string;
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
      price_usd: string;
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
      price_usd: string;
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
  const formatted = formatPrice(amount);
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