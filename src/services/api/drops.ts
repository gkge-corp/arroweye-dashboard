import apiRequest from "@/Server/Api";
import type { AppDropZonePage, Business, DropZone } from "@/types/api";
import { DropzonePayload } from "@/types/dropzone";
import ls from "localstorage-slim";

if (typeof window !== "undefined" && window?.localStorage)
  ls.config.storage = localStorage;

export const getDropZones = async ({
  page = 1,
  search = "",
  year = "",
  month = "",
  vendor = "",
  subvendor = "",
  platform = "",
}: {
  page?: number;
  search?: string;
  year?: string;
  month?: string;
  vendor?: string;
  subvendor?: string;
  platform?: string;
}): Promise<AppDropZonePage> => {
  const params: Record<string, string | number> = { page };
  if (search) params.search = search;
  if (year) params.year = year;
  if (month) params.month = month;
  if (vendor) params.vendor = vendor;
  if (subvendor) params.subvendor = subvendor;
  if (platform) params.platform = platform;

  const response = await apiRequest<AppDropZonePage>({
    method: "GET",
    url: `/api/drops`,
    params,
    requireToken: true,
  });

  return response;
};

export const getCampaignDropZones = (
  projectId: number | string,
): Promise<DropZone[]> =>
  apiRequest<DropZone[]>({
    method: "GET",
    url: `/api/campaigns/${projectId}/drops`,
    requireToken: true,
  });

export const deleteDropZones = async (id: number): Promise<void> => {
  await apiRequest<void>({
    method: "DELETE",
    url: `/api/drops/${id}`,
    requireToken: true,
    skipErrorHandling: true,
  });
};

export const getBusiness = async (): Promise<Business[]> => {
  const response = await apiRequest<Business[]>({
    method: "GET",
    url: `/api/organizations`,
    requireToken: true,
  });

  return response;
};

export const getStoredBusiness = (): Business[] | null => {
  const content = ls.get("Business", { decrypt: true });

  return content as Business[] | null;
};

export const createDropzone = async (
  projectId: string,
  data: DropzonePayload,
): Promise<DropzonePayload | null> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: `/api/campaigns/${projectId}/drops`,
      data,
      requireToken: true,
    });

    return response as DropzonePayload;
  } catch (error: unknown) {
    return null;
  }
};
