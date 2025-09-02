const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface User {
  id: number;
  name?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  client_code?: string;
  phone?: string;
  role?: string;
  user_type: 'user' | 'client' | 'admin';
}

export interface AuthResponse {
  message: string;
  token: string;
  user?: User;
  client?: User;
  admin?: User;
  user_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  payment_plan?: 'weekly' | 'monthly';
  address?: string;
  location?: string;
}

class AuthService {
  private getAuthHeader() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      };
      
      const response = await fetch(url, {
        headers,
        ...options,
      });

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON, it might be HTML error page
        const text = await response.text();
        console.error('❌ Non-JSON response:', text);
        throw new Error('Server returned invalid response');
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // User Authentication (backward compatibility)
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_type', response.user_type || 'user');
    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.makeRequest('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_type', response.user_type || 'user');
    return response;
  }

  // Client Authentication
  async clientLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔐 Client login attempt:', { email: credentials.email });
    
    const response = await this.makeRequest('/client/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    console.log('💾 Storing auth data:', { 
      token: response.token ? 'present' : 'missing',
      userType: 'client' 
    });
    
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_type', 'client');
    
    // Verify storage
    const storedToken = localStorage.getItem('auth_token');
    const storedUserType = localStorage.getItem('user_type');
    console.log('✅ Auth data stored:', { 
      tokenStored: !!storedToken,
      userTypeStored: storedUserType 
    });
    
    return response;
  }

  async clientRegister(data: RegisterData): Promise<AuthResponse> {
    const response = await this.makeRequest('/client/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_type', 'client');
    return response;
  }

  // Admin Authentication
  async adminLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.makeRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_type', 'admin');
    return response;
  }

  async adminRegister(data: RegisterData): Promise<AuthResponse> {
    const response = await this.makeRequest('/admin/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_type', 'admin');
    return response;
  }

  // Common methods
  async logout(): Promise<void> {
    const userType = localStorage.getItem('user_type') || 'user';
    
    try {
      if (userType === 'client') {
        await this.makeRequest('/client/logout', { method: 'POST' });
      } else if (userType === 'admin') {
        await this.makeRequest('/admin/logout', { method: 'POST' });
      } else {
        await this.makeRequest('/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_type');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const userType = localStorage.getItem('user_type') || 'user';
    const token = localStorage.getItem('auth_token');
    
    console.log('🔍 getCurrentUser called:', { userType, hasToken: !!token });
    
    if (!token) {
      console.log('❌ No auth token found');
      return null;
    }
    
    try {
      if (userType === 'client') {
        console.log('🔍 Fetching client profile...');
        const response = await this.makeRequest('/client/profile');
        console.log('✅ Client profile response:', response);
        return { ...response.client, user_type: 'client' };
      } else if (userType === 'admin') {
        console.log('🔍 Fetching admin profile...');
        const response = await this.makeRequest('/admin/profile');
        console.log('✅ Admin profile response:', response);
        return { ...response.admin, user_type: 'admin' };
      } else {
        const response = await this.makeRequest('/user');
        return response;
      }
    } catch (error) {
      console.error('❌ getCurrentUser error:', error);
      // Clear invalid tokens
      this.logout();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getUserType(): string {
    return localStorage.getItem('user_type') || 'user';
  }

  // Profile Management Methods
  async getProfileDetails(): Promise<any> {
    const userType = localStorage.getItem('user_type') || 'user';
    
    if (userType === 'client') {
      return await this.makeRequest('/client/profile-details');
    } else if (userType === 'admin') {
      return await this.makeRequest('/admin/profile-details');
    }
    throw new Error('Invalid user type');
  }

  async updateProfile(profileData: any): Promise<any> {
    const userType = localStorage.getItem('user_type') || 'user';
    
    if (userType === 'client') {
      return await this.makeRequest('/client/profile-details', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    } else if (userType === 'admin') {
      return await this.makeRequest('/admin/profile-details', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    }
    throw new Error('Invalid user type');
  }

  async changePassword(passwordData: { current_password: string; new_password: string; new_password_confirmation: string }): Promise<any> {
    const userType = localStorage.getItem('user_type') || 'user';
    
    if (userType === 'client') {
      return await this.makeRequest('/client/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });
    } else if (userType === 'admin') {
      return await this.makeRequest('/admin/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });
    }
    throw new Error('Invalid user type');
  }

  async getPreferences(): Promise<any> {
    const userType = localStorage.getItem('user_type') || 'user';
    
    if (userType === 'client') {
      return await this.makeRequest('/client/preferences');
    } else if (userType === 'admin') {
      return await this.makeRequest('/admin/preferences');
    }
    throw new Error('Invalid user type');
  }

  async updatePreferences(preferences: any): Promise<any> {
    const userType = localStorage.getItem('user_type') || 'user';
    
    if (userType === 'client') {
      return await this.makeRequest('/client/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    } else if (userType === 'admin') {
      return await this.makeRequest('/admin/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    }
    throw new Error('Invalid user type');
  }

  // Client-specific methods
  async getPaymentSummary(): Promise<any> {
    return await this.makeRequest('/client/payment-summary');
  }

  // Admin Dashboard Methods
  async getDashboardStats(): Promise<any> {
    return await this.makeRequest('/admin/dashboard');
  }

  async getClientStatistics(): Promise<any> {
    return await this.makeRequest('/admin/dashboard/clients');
  }

  async getRevenueStatistics(): Promise<any> {
    return await this.makeRequest('/admin/dashboard/revenue');
  }

  async getApplianceStatistics(): Promise<any> {
    return await this.makeRequest('/admin/dashboard/appliances');
  }

  // Admin Appliance Management Methods (NEW)
  async getAppliances(params?: {
    search?: string;
    status?: string;
    location?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_direction?: 'asc' | 'desc';
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_direction) queryParams.append('sort_direction', params.sort_direction);

    const queryString = queryParams.toString();
    const endpoint = `/admin/appliances${queryString ? `?${queryString}` : ''}`;
    
    return await this.makeRequest(endpoint);
  }

  async getAppliance(id: string | number): Promise<any> {
    return await this.makeRequest(`/admin/appliances/${id}`);
  }

  async updateApplianceStatus(id: string | number, status: string, notes?: string): Promise<any> {
    return await this.makeRequest(`/admin/appliances/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  async toggleAppliancePower(id: string | number, powerOn: boolean): Promise<any> {
    return await this.makeRequest(`/admin/appliances/${id}/toggle-power`, {
      method: 'POST',
      body: JSON.stringify({ power_on: powerOn }),
    });
  }

  async syncApplianceStatus(id: string | number): Promise<any> {
    return await this.makeRequest(`/admin/appliances/${id}/sync`, {
      method: 'POST',
    });
  }
}

export const authService = new AuthService(); 