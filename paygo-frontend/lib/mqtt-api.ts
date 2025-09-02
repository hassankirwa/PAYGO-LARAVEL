const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// MQTT Configuration Types
export interface MqttSettings {
  [key: string]: {
    key: string;
    value: string;
    actual_value: string;
    description: string;
    is_encrypted: boolean;
  };
}

export interface MqttConnectionStatus {
  enabled: boolean;
  host: string;
  port: string;
  has_auth: boolean;
  ssl_enabled: boolean;
  client_id: string;
  topic_prefix: string;
}

export interface MqttTestResult {
  success: boolean;
  config: {
    host: string;
    port: string;
    enabled: boolean;
  };
  timestamp: string;
  error?: string;
}

export interface DeviceOverview {
  device_stats: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
  };
  subscription_stats: {
    active: number;
    expired: number;
    suspended: number;
  };
  recent_devices: Array<{
    id: number;
    device_id: string;
    client_name: string;
    product_name: string;
    status: string;
    last_ping: string | null;
    created_at: string;
  }>;
}

export interface DeviceStatus {
  device: {
    id: number;
    device_id: string;
    status: string;
    last_ping: string | null;
    client_name: string;
    product_name: string;
    created_at: string;
  };
  subscription: {
    id: number;
    status: string;
    start_date: string;
    end_date: string;
    days_remaining: number;
    subscription_type: string;
  } | null;
  mqtt_status: {
    status: string;
    message?: string;
  };
}

// API Helper Functions
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token'); // Use auth_token instead of admin_token
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'ngrok-skip-browser-warning': 'true',
  };
};

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed: ${response.statusText}`);
  }
  return response.json();
};

// MQTT Configuration API
export const mqttConfigApi = {
  // Get MQTT configuration
  getConfig: async (): Promise<{
    success: boolean;
    settings: MqttSettings;
    connection_status: MqttConnectionStatus;
    categories: Record<string, any>;
  }> => {
    const response = await fetch(`${API_BASE_URL}/admin/mqtt/config`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Update MQTT configuration
  updateConfig: async (settings: Array<{ key: string; value: string }>): Promise<{
    success: boolean;
    message: string;
    updated_settings: Array<any>;
  }> => {
    const response = await fetch(`${API_BASE_URL}/admin/mqtt/config`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings }),
    });
    return handleApiResponse(response);
  },

  // Test MQTT connection
  testConnection: async (): Promise<{
    success: boolean;
    test_result: MqttTestResult;
  }> => {
    const response = await fetch(`${API_BASE_URL}/admin/mqtt/test-connection`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
};

// Device Management API
export const deviceManagementApi = {
  // Get device overview
  getOverview: async (): Promise<{
    success: boolean;
    overview: DeviceOverview;
    mqtt_status: MqttConnectionStatus;
  }> => {
    const response = await fetch(`${API_BASE_URL}/admin/mqtt/devices/overview`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Start device manually
  startDevice: async (deviceId: string, duration?: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    device_id: string;
    end_date: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/admin/mqtt/devices/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        device_id: deviceId,
        duration,
        reason,
      }),
    });
    return handleApiResponse(response);
  },

  // Stop device manually
  stopDevice: async (deviceId: string, reason?: string): Promise<{
    success: boolean;
    message: string;
    device_id: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/admin/mqtt/devices/stop`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        device_id: deviceId,
        reason,
      }),
    });
    return handleApiResponse(response);
  },

  // Check device status
  checkDeviceStatus: async (deviceId: string): Promise<{
    success: boolean;
  } & DeviceStatus> => {
    const response = await fetch(`${API_BASE_URL}/admin/mqtt/devices/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        device_id: deviceId,
      }),
    });
    return handleApiResponse(response);
  },

  // Create new device
  createDevice: async (deviceData: {
    device_id: string;
    serial_number: string;
    product_id: number;
    client_id?: number;
    installation_location?: string;
    installation_notes?: string;
    status: string;
  }): Promise<{
    success: boolean;
    message: string;
    device: any;
  }> => {
    const response = await fetch(`${API_BASE_URL}/admin/mqtt/devices/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(deviceData),
    });
    return handleApiResponse(response);
  },

  // Get products for device creation
  getProductsForDevice: async (): Promise<{
    success: boolean;
    products: Array<{
      id: number;
      name: string;
      model_code: string;
      category: { id: number; name: string };
    }>;
  }> => {
    const response = await fetch(`${API_BASE_URL}/admin/mqtt/devices/products`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },

  // Get clients for device assignment
  getClientsForDevice: async (): Promise<{
    success: boolean;
    clients: Array<{
      id: number;
      name: string;
      phone: string;
      email: string;
      location: string;
    }>;
  }> => {
    const response = await fetch(`${API_BASE_URL}/admin/mqtt/devices/clients`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleApiResponse(response);
  },
};

// Subscription API for client dashboard
export const subscriptionApi = {
  // Get client subscription status
  getClientSubscriptions: async (): Promise<{
    success: boolean;
    subscriptions: Array<{
      id: number;
      device_id: string;
      subscription_type: string;
      status: string;
      start_date: string;
      end_date: string;
      days_remaining: number;
      hours_remaining: number;
      progress_percentage: number;
      appliance: {
        id: number;
        device_id: string;
        status: string;
        product: {
          name: string;
          model_code: string;
        };
      };
    }>;
  }> => {
    const token = localStorage.getItem('auth_token'); // Use auth_token instead of client_token
    console.log('🔍 Client token from localStorage:', token ? 'Token exists' : 'No token found');
    console.log('🌐 Making request to:', `${API_BASE_URL}/client/subscriptions`);
    
    const response = await fetch(`${API_BASE_URL}/client/subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    return handleApiResponse(response);
  },

  // Get subscription countdown for specific device
  getSubscriptionCountdown: async (deviceId: string): Promise<{
    success: boolean;
    subscription: {
      id: number;
      status: string;
      end_date: string;
      days_remaining: number;
      hours_remaining: number;
      progress_percentage: number;
    } | null;
  }> => {
    const token = localStorage.getItem('client_token');
    const response = await fetch(`${API_BASE_URL}/client/subscriptions/${deviceId}/countdown`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    return handleApiResponse(response);
  },
};

// Utility functions
export const mqttUtils = {
  // Format device status for display
  formatDeviceStatus: (status: string): { label: string; color: string } => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: 'Active', color: 'green' },
      suspended: { label: 'Suspended', color: 'red' },
      pending_activation: { label: 'Pending', color: 'yellow' },
      maintenance: { label: 'Maintenance', color: 'blue' },
      offline: { label: 'Offline', color: 'gray' },
    };
    return statusMap[status] || { label: status, color: 'gray' };
  },

  // Format subscription status for display
  formatSubscriptionStatus: (status: string): { label: string; color: string } => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: 'Active', color: 'green' },
      expired: { label: 'Expired', color: 'red' },
      suspended: { label: 'Suspended', color: 'orange' },
      cancelled: { label: 'Cancelled', color: 'gray' },
      maintenance: { label: 'Maintenance', color: 'blue' },
    };
    return statusMap[status] || { label: status, color: 'gray' };
  },

  // Format time remaining
  formatTimeRemaining: (hours: number): string => {
    if (hours <= 0) return 'Expired';
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day';
    return `${days} days`;
  },

  // Format duration for device control
  formatDuration: (duration: string): string => {
    const durationMap: Record<string, string> = {
      'PT1H': '1 hour',
      'P1D': '1 day',
      'P1W': '1 week',
      'P1M': '1 month',
      'P3M': '3 months',
      'P6M': '6 months',
      'P1Y': '1 year',
    };
    return durationMap[duration] || duration;
  },

  // Get duration options for device control
  getDurationOptions: (): Array<{ value: string; label: string }> => [
    { value: 'PT1H', label: '1 Hour' },
    { value: 'P1D', label: '1 Day' },
    { value: 'P1W', label: '1 Week' },
    { value: 'P1M', label: '1 Month' },
    { value: 'P3M', label: '3 Months' },
    { value: 'P6M', label: '6 Months' },
    { value: 'P1Y', label: '1 Year' },
  ],

  // Get stop reasons for device control
  getStopReasons: (): Array<{ value: string; label: string }> => [
    { value: 'manual_stop', label: 'Manual Stop' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'payment_overdue', label: 'Payment Overdue' },
    { value: 'subscription_expired', label: 'Subscription Expired' },
  ],
}; 