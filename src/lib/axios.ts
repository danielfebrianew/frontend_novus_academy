import axios, { AxiosRequestConfig, AxiosError } from "axios";

export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.novusnextgen.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.includes("/auth")) {
        
      }
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  get: async <T>(url: string, config?: AxiosRequestConfig) => {
    const response = await api.get<T>(url, config);
    return response.data;
  },

  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
    const response = await api.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig) => {
    const response = await api.delete<T>(url, config);
    return response.data;
  },

  upload: async <T>(url: string, formData: FormData) => {
    const response = await api.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

export default api;