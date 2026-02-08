// lib/fetch.ts
import { authService } from './authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    const text = await response.text();
    return text as any;
  }
};

const fetchWithDefaults = async (
  url: string, 
  options: RequestInit = {},
  retryCount: number = 0
): Promise<Response> => {
  const token = authService.getAccessToken();
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (response.status === 401 && retryCount === 0) {
    try {
      await authService.refresh();
      return fetchWithDefaults(url, options, retryCount + 1);
    } catch {
      if (typeof window !== "undefined" && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired');
    }
  }

  return response;
};

export const apiService = {
  get: async <T>(url: string, config?: RequestInit) => {
    const response = await fetchWithDefaults(url, {
      ...config,
      method: 'GET',
    });
    return handleResponse<T>(response);
  },

  post: async <T>(url: string, data?: any, config?: RequestInit) => {
    const response = await fetchWithDefaults(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  put: async <T>(url: string, data?: any, config?: RequestInit) => {
    const response = await fetchWithDefaults(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  patch: async <T>(url: string, data?: any, config?: RequestInit) => {
    const response = await fetchWithDefaults(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(url: string, config?: RequestInit) => {
    const response = await fetchWithDefaults(url, {
      ...config,
      method: 'DELETE',
    });
    return handleResponse<T>(response);
  },

  upload: async <T>(url: string, formData: FormData, config?: RequestInit) => {
    const token = authService.getAccessToken();
    const { headers, ...restConfig } = config || {};
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
      ...restConfig,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    return handleResponse<T>(response);
  },
};

export default apiService;