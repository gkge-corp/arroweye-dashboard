import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from "axios";
import type { ToastId } from "@/types/toast";
import { handleApiError, redirectToLogin } from "../lib/utils";
import {
  getAuthSession,
  setAuthSession,
  setAuthTokenCookie,
} from "@/lib/auth-storage";
import type { AuthSession } from "@/types/api";

interface AuthenticatedRequestConfig extends AxiosRequestConfig {
  _requiresAuth?: boolean;
  _retry?: boolean;
}

interface InternalAuthenticatedRequestConfig
  extends InternalAxiosRequestConfig {
  _requiresAuth?: boolean;
  _retry?: boolean;
}

interface RefreshResponse {
  access: string;
}

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_SERVER_DOMAIN as string,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_SERVER_DOMAIN as string,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;

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

const refreshAccessToken = (session: AuthSession): Promise<string> => {
  if (!session.refresh) {
    return Promise.reject(new Error("No refresh token is available."));
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<RefreshResponse>("/refresh/", { refresh: session.refresh })
      .then(({ data }) => {
        if (!data.access) {
          throw new Error("The refresh endpoint did not return an access token.");
        }

        setAuthSession({ ...session, access: data.access });
        setAuthTokenCookie(data.access);
        return data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const request = error.config as
      | InternalAuthenticatedRequestConfig
      | undefined;

    if (
      error.response?.status === 401 &&
      request?._requiresAuth &&
      !request._retry
    ) {
      request._retry = true;
      const session = getAuthSession();

      if (session?.refresh) {
        try {
          const accessToken = await refreshAccessToken(session);
          request.headers = new AxiosHeaders(request.headers);
          request.headers.set("Authorization", `Bearer ${accessToken}`);
          return axiosInstance(request);
        } catch (refreshError) {
          redirectToLogin();
          return Promise.reject(refreshError);
        }
      }
    }

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
