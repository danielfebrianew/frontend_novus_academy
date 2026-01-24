// lib/fetch.ts

import { ApiResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Helper function untuk handle fetch response
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

  // ✅ FIX: Cek content-type sebelum parse JSON
  const contentType = response.headers.get("content-type");
  
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    // Jika bukan JSON, return text atau blob
    const text = await response.text();
    return text as any;
  }
};

// Helper function untuk fetch dengan default options
const fetchWithDefaults = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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

  // Intercept untuk handle 401
  if (response.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.includes("/auth")) {
      // Redirect atau handle unauthorized
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

  // ✅ FIX: Upload khusus untuk FormData
  upload: async <T>(url: string, formData: FormData, config?: RequestInit) => {
    // ✅ PENTING: Jangan set Content-Type untuk FormData
    // Browser akan set otomatis dengan boundary yang benar
    const { headers, ...restConfig } = config || {};
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      ...restConfig,
      // ✅ Jangan include headers untuk FormData
    });

    // Handle error manual karena tidak lewat fetchWithDefaults
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