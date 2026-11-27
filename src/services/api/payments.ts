import apiRequest from "@/Server/Api";
import { handleApiError } from "@/lib/utils";
import type {
  CreateInvoiceInput,
  CreateServiceInput,
} from "@/types/api";
import { ContentItem } from "@/types/contents";
import axios from "axios";
import ls from "localstorage-slim";
import { toast } from "sonner";

if (typeof window !== "undefined" && window?.localStorage)
  ls.config.storage = localStorage;

interface ApiResponse {
  action: string;
  url: string;
  status: number | string;
}

interface ApiRequestResponse<T> {
  data: T;
  message: string;
  status: number | string;
}

interface FundWalletPayload {
  amount_naira: number;
  callback_url?: string;
}

interface PaystackInitialization {
  authorization_url: string;
  access_code?: string;
  reference?: string;
}

interface FundWalletResponse {
  paystack?: PaystackInitialization;
}

type MediaUploadKind = "report" | "cover";

// Files go straight to storage with a signed URL; the API only receives the returned key.
const uploadMediaFile = async (
  projectId: number,
  kind: MediaUploadKind,
  file: File,
): Promise<string> => {
  const { upload_url, key, content_type } = await apiRequest<{
    upload_url: string;
    key: string;
    content_type: string;
  }>({
    method: "POST",
    url: `/api/campaigns/${projectId}/media/upload-url`,
    data: { kind, file_name: file.name },
    requireToken: true,
  });

  const response = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": content_type },
    body: file,
  });
  if (!response.ok) throw new Error("The file could not be uploaded.");
  return key;
};

export const CreateMedia = async (
  id: number,
  payload: Record<string, unknown>,
): Promise<unknown> => {
  try {
    const { report, files, ...fields } = payload;
    const data: Record<string, unknown> = { ...fields };
    if (report instanceof File) {
      data.report_key = await uploadMediaFile(id, "report", report);
    }
    if (Array.isArray(files)) {
      data.file_keys = await Promise.all(
        files.map((file: File) => uploadMediaFile(id, "cover", file)),
      );
    }

    const response = await apiRequest<unknown>({
      method: "POST",
      url: `/api/campaigns/${id}/media`,
      data,
      requireToken: true,
    });
    toast.success("Creation successful!");
    return response;
  } catch (error: unknown) {
    // apiRequest already toasts API failures; rethrow so callers don't treat it as saved.
    console.error("Create media failed:", error);
    throw error;
  }
};

export const updateMedia = (
  projectId: number | string,
  id: number,
  payload: Record<string, unknown>,
) =>
  apiRequest<unknown>({
    method: "PATCH",
    url: `/api/campaigns/${projectId}/media/${id}`,
    data: payload,
    requireToken: true,
  });

export const deleteMedia = async (
  projectId: number | string,
  id: number,
): Promise<void> => {
  await apiRequest<void>({
    method: "DELETE",
    url: `/api/campaigns/${projectId}/media/${id}`,
    requireToken: true,
  });
};

export const CreateService = async (
  payload: CreateServiceInput,
): Promise<void> => {
  try {
    const { data: response } = await apiRequest<
      ApiRequestResponse<ApiResponse>
    >({
      method: "POST",
      url: `/api/payments/services`,
      data: payload,
      requireToken: true,
    });

    console.log(response);
    toast.success("Service Created Successful!");
  } catch (error: unknown) {
    return;
  }
};

export const CreateInvoice = async (
  payload: CreateInvoiceInput,
): Promise<void> => {
  try {
    const { data: response } = await apiRequest<
      ApiRequestResponse<ApiResponse>
    >({
      method: "POST",
      url: `/api/payments/invoices`,
      data: payload,
      requireToken: true,
      skipErrorHandling: true,
    });

    console.log(response);
    toast.success("Invoice Created Successful!");
    window.location.reload();
  } catch (error: unknown) {
    if (isDuplicatePoCodeError(error)) {
      toast.error(DUPLICATE_PO_CODE_MESSAGE);
      throw new DuplicatePoCodeError();
    }
    handleApiError(error);
    throw error;
  }
};

export const DUPLICATE_PO_CODE_MESSAGE =
  "An invoice with this PO code already exists. Please use a different PO code.";

export class DuplicatePoCodeError extends Error {
  constructor() {
    super(DUPLICATE_PO_CODE_MESSAGE);
    this.name = "DuplicatePoCodeError";
  }
}

// The backend surfaces the database's unique-constraint failure as raw text,
// so it is matched on the constraint and column names rather than a code.
const isDuplicatePoCodeError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  if (error.response?.status === 409) return true;
  const body = JSON.stringify(error.response?.data ?? "");
  return (
    body.includes("payments_invoice_po_code_key") ||
    (body.includes("po_code") && /already exists|unique/i.test(body))
  );
};

export const getInvoice = async (): Promise<ContentItem[] | null> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: `/api/payments/invoices`,
      data: null,
      requireToken: true,
    });

    ls.set("Invoice", response, { encrypt: true });

    return response as ContentItem[];
  } catch (error: unknown) {
    return null;
  }
};

export const getStoredInvoice = (): ContentItem[] | null => {
  const content = ls.get("Invoice", { decrypt: true });

  return content as ContentItem[];
};

export const getService = async (): Promise<ContentItem[] | null> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: `/api/payments/services`,
      data: null,
      requireToken: true,
    });

    ls.set("Service", response, { encrypt: true });

    return response as ContentItem[];
  } catch (error: unknown) {
    return null;
  }
};

export const getStoredService = (): ContentItem[] | null => {
  const content = ls.get("Service", { decrypt: true });

  return content as ContentItem[];
};

export const getPaymentInvoice = async (id: number): Promise<any | null> => {
  const endpoint = `/api/payments/invoices/${id}`;

  try {
    const response = await apiRequest({
      method: "GET",
      url: endpoint,
      data: null,
      requireToken: true,
      silent: true,
    });

    ls.set("PaymentInvoice", response, { encrypt: true });

    return response as any;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Failed to fetch payment invoice", {
        invoiceId: id,
        endpoint,
        status: error.response?.status,
        statusText: error.response?.statusText,
        response: error.response?.data,
        message: error.message,
      });
    } else {
      console.error("Failed to fetch payment invoice", {
        invoiceId: id,
        endpoint,
        error,
      });
    }

    return null;
  }
};

export const getChannel = async (): Promise<ContentItem[] | null> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: `/api/v1/projects/general/airplay/`,
      data: null,
      requireToken: true,
    });

    ls.set("Channel", response, { encrypt: true });

    return response as ContentItem[];
  } catch (error: unknown) {
    return null;
  }
};

export const getMetric = async (): Promise<ContentItem[] | null> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: `/api/v1/projects/general/metric/`,
      data: null,
      requireToken: true,
    });

    ls.set("Metric", response, { encrypt: true });

    return response as ContentItem[];
  } catch (error: unknown) {
    return null;
  }
};

export const getSocialMedia = async (): Promise<ContentItem[] | null> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: `/api/v1/projects/general/social-media/`,
      data: null,
      requireToken: true,
    });

    ls.set("SocialMedia", response, { encrypt: true });

    return response as ContentItem[];
  } catch (error: unknown) {
    return null;
  }
};

export const getDsp = async (): Promise<ContentItem[] | null> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: `/api/v1/projects/general/dsp/`,
      data: null,
      requireToken: true,
    });

    ls.set("Dsp", response, { encrypt: true });

    return response as ContentItem[];
  } catch (error: unknown) { 
    return null;
  }
};

export const initializePayment = async (payload: {
  invoice_id: number;
}): Promise<any> => {
  try {
    // The API picks the reference and sends the receipt to the signed-in payer.
    const response = await apiRequest<PaystackInitialization>({
      method: "POST",
      url: `/api/payments/invoices/${payload.invoice_id}/pay`,
      requireToken: true,
    });
    console.dir(response, { depth: 100 });
    return response;
  } catch (error: unknown) {
    console.dir(error, { depth: 100 });
  }
};

export const getCampaignWallet = async (): Promise<any | null> => {
  try {
    let url = `/api/wallet`;

    const response = await apiRequest({
      method: "GET",
      url: url,
      data: null,
      requireToken: true,
    });

    return response as any;
  } catch (error: unknown) {
    return null;
  }
};

export const fundCampaignWallet = async (
  payload: FundWalletPayload,
): Promise<FundWalletResponse | null> => {
  try {
    const result = await apiRequest<FundWalletResponse>({
      method: "POST",
      url: `/api/wallet/fund`,
      data: payload,
      requireToken: true,
    });

    toast.info("Payment Initiated Successfully");
    console.log("PAYMENT RESPONSE", result);
    return result;
  } catch (error: unknown) {
    return null;
  }
};

export const verifyWalletPayment = async (
  reference: string,
): Promise<any | null> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: `/api/wallet/verify`,
      params: { reference },
      requireToken: true,
    });

    return response as any;
  } catch (error: unknown) {
    throw error;
  }
};

export const getPromoterPlans = async (params?: {
  search?: string;
}): Promise<any | null> => {
  try {
    let url = `/api/marketplace/aggregators`;

    const query = new URLSearchParams();

    if (params?.search) {
      query.append("search", params.search);
    }

    const queryString = query.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await apiRequest({
      method: "GET",
      url,
      data: null,
      requireToken: true,
    });

    return response as any;
  } catch (error: unknown) {
    return null;
  }
};
