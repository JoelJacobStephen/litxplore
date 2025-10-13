import Axios, { AxiosError, AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create the base Axios instance
export const axiosInstance = Axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Token getter function - will be set by the auth provider
let tokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Set the token getter function from Clerk auth
 * This should be called once during app initialization
 */
export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

// Request interceptor to add authentication token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get the token using the token getter if available
    if (tokenGetter) {
      try {
        const token = await tokenGetter();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to get auth token:", error);
      }
    }

    // Add cache-busting headers
    config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors consistently
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { data, status } = error.response;

      // Parse standardized error format from backend
      let errorMessage = `Request failed with status ${status}`;

      if (data && typeof data === "object") {
        const errorData = data as any;

        // Handle standardized error format
        if (errorData.status === "error" && errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
        } else if (errorData.detail) {
          errorMessage = Array.isArray(errorData.detail)
            ? errorData.detail[0]?.msg || errorData.detail[0] || errorMessage
            : errorData.detail;
        }
      }

      // Create a new error with the parsed message
      const customError = new Error(errorMessage);
      return Promise.reject(customError);
    }

    // Network error or no response
    return Promise.reject(error);
  }
);

// Custom instance for Orval
export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = axiosInstance({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

export default customInstance;
