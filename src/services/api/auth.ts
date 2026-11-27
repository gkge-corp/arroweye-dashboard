import apiRequest from "@/Server/Api";
import type {
  AddStaffInput,
  AuthenticatedUser,
  AuthSession,
  BusinessStaff,
  LoginRequest,
  LoginResponse,
  VerifyLoginRequest,
} from "@/types/api";
import ls from "localstorage-slim";

if (typeof window !== "undefined" && window?.localStorage)
  ls.config.storage = localStorage;

export const getLoggedInUser = async (): Promise<AuthenticatedUser | null> => {
  try {
    const response = await apiRequest<AuthenticatedUser>({
      method: "GET",
      url: `/api/me`,
      requireToken: true,
    });

    return response;
  } catch (error: unknown) {
    return null;
  }
};

export const LoginEP = async (payload: LoginRequest): Promise<LoginResponse> => {
  await apiRequest<{ success: boolean }>({
    method: "POST",
    url: `/api/auth/email-otp/send-verification-otp`,
    data: { email: payload.email, type: "sign-in" },
    requireToken: false,
  });

  return { message: "Kindly check your email for login token" };
};

export const Verify = async (payload: unknown): Promise<void> => {
  try {
    const response = await apiRequest<any>({
      method: "POST",
      url: `/verify-otp/`,
      data: payload,
      requireToken: false,
    });

    console.log("VERIFY OTP", response);
  } catch (error: unknown) {
    return;
  }
};

export const VerifyLogin = async (
  payload: VerifyLoginRequest,
): Promise<AuthSession> => {
  const { token } = await apiRequest<{ token: string }>({
    method: "POST",
    url: `/api/auth/sign-in/email-otp`,
    data: { email: payload.email, otp: payload.token },
    requireToken: false,
  });

  const user = await apiRequest<AuthenticatedUser>({
    method: "GET",
    url: `/api/me`,
    headers: { Authorization: `Bearer ${token}` },
    requireToken: false,
  });

  return { access: token, user };
};

export const AddStaff = async (
  payload: AddStaffInput,
): Promise<AddStaffInput> => {
  const { business_id, project_id, ...member } = payload;
  const response = await apiRequest<AddStaffInput>({
    method: "POST",
    url: `/api/organizations/${business_id}/members`,
    data: { ...member, campaign_id: project_id ?? undefined },
    requireToken: true,
  });

  return response;
};

export const getBusinessStaff = async (
  id: number,
): Promise<BusinessStaff[] | null> => {
  try {
    const response = await apiRequest<BusinessStaff[]>({
      method: "GET",
      url: `/api/organizations/${id}/members`,
      requireToken: true,
    });

    return response;
  } catch (error: unknown) {
    return null;
  }
};
