import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from "axios";
import type { ToastId } from "@/types/toast";
import { handleApiError } from "../lib/utils";
import { getAuthSession } from "@/lib/auth-storage";

interface AuthenticatedRequestConfig extends AxiosRequestConfig {
  _requiresAuth?: boolean;
}

interface InternalAuthenticatedRequestConfig
  extends InternalAxiosRequestConfig {
  _requiresAuth?: boolean;
}

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_SERVER_DOMAIN as string,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("Base URL:", process.env.NEXT_PUBLIC_APP_SERVER_DOMAIN);

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authenticatedConfig = config as InternalAuthenticatedRequestConfig;

    if (authenticatedConfig._requiresAuth) {
      const content = getAuthSession();
      const token = content?.access || content?.token;

      if (token) {
        authenticatedConfig.headers = new AxiosHeaders(
          authenticatedConfig.headers,
        );
        authenticatedConfig.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return authenticatedConfig;
  },
  (error) => {
    return Promise.reject(error);
  },
);

interface ApiRequestParams {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  requireToken?: boolean;
  headers?: Record<string, string>;
  skipErrorHandling?: boolean;
  silent?: boolean;
  loadingToastId?: ToastId | null;
}

const apiRequest = async <T>({
  method,
  url,
  data = null,
  params = {},
  requireToken = true,
  headers = {},
  skipErrorHandling = false,
  silent = false,
  loadingToastId = null,
}: ApiRequestParams): Promise<T> => {
  try {
    const requestHeaders = { ...axiosInstance.defaults.headers, ...headers };

    const response: AxiosResponse<T> = await axiosInstance({
      method,
      url,
      data,
      params,
      headers: requestHeaders,
      _requiresAuth: requireToken,
    } as AuthenticatedRequestConfig);

    return response.data;
  } catch (error) {
    if (!silent) {
      console.error("API request error:", error);
    }

    if (skipErrorHandling === true) {
      if (loadingToastId) {
        handleApiError(error, `Request failed. Please try again.`, {
          toastId: loadingToastId,
          autoClose: 3000,
        });
      }
    } else if (!silent) {
      handleApiError(error, `Request failed. Please try again.`);
    }

    throw error;
  }
};

export default apiRequest;
