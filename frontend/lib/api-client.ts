import axios, { type AxiosInstance, type AxiosError } from "axios";

// Dynamic API base URL:
// - In browser: uses current origin (works with reverse proxy/domain)
// - In SSR/build: uses env var or localhost fallback
// - For local dev: explicitly set NEXT_PUBLIC_API_URL=http://localhost:3132
function getApiBaseUrl(): string {
  // If running in browser (client-side)
  if (typeof window !== "undefined") {
    // Check if we're on localhost - use explicit backend port
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3132";
    }
    // For production/domain - use same origin (nginx will proxy)
    return window.location.origin;
  }
  // Server-side: use env var or default
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3132";
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getApiBaseUrl(),
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token")
            : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      },
    );
  }

  get instance() {
    return this.client;
  }

  setAuthToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }

  clearAuthToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  }
}

export const apiClient = new ApiClient();
export const api = apiClient.instance;

// Helper function to poll export status
export const pollExportStatus = async (exportId: string, timeout = 60000) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await api.get(`/export/${exportId}`);

      if (response.data.status === 'COMPLETED') {
        return response.data;
      } else if (response.data.status === 'FAILED') {
        throw new Error(response.data.errorMessage || 'Export failed');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      throw error;
    }
  }

  throw new Error('Export timeout');
};
