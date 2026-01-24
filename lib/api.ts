const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('userToken');
  }

  if (token && config.headers) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    let data: ApiResponse<T>;
    
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON, handle as text
      const text = await response.text();
      throw new ApiError(text || 'Invalid response format', response.status);
    }

    if (!response.ok) {
      const errorMsg = data.error || data.message || 'Request failed';
      throw new ApiError(errorMsg, response.status, data);
    }

    // Handle backend response format: { success: true, data: {...} }
    if (data.success && data.data !== undefined) {
      return data.data as T;
    }
    
    // Handle direct data response
    if (data.data !== undefined) {
      return data.data as T;
    }
    
    // Return the whole response if it's the data itself
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle connection refused and network errors
    if (error instanceof TypeError) {
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new ApiError('Cannot connect to server. Please make sure the backend server is running on port 5000.', 0);
      }
    }
    // Check for connection refused in error message
    if (error instanceof Error && (error.message.includes('ERR_CONNECTION_REFUSED') || error.message.includes('connection refused'))) {
      throw new ApiError('Backend server is not running. Please start the server on port 5000.', 0);
    }
    const errorMsg = error instanceof Error ? error.message : 'Network error';
    throw new ApiError(errorMsg, 0);
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) => {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) => {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) => {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T>(endpoint: string, options?: RequestInit) => {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

export { ApiError };

