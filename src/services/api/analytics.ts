import ls from "localstorage-slim";
import apiRequest from "@/Server/Api";
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

interface CreateChannelPayload {
  name: string;
  impressions: number;
  audience: number;
  channel: string;
  metric_ids: number[];
}

interface UpdateStatPayload {
  metric: number;
  week_1: number;
  week_2: number;
  week_3: number;
  week_4: number;
}

interface ToastOptions {
  showToast?: boolean;
}

export const CreateMetric = async (payload: unknown): Promise<void> => {
  try {
    const { data: response } = await apiRequest<
      ApiRequestResponse<ApiResponse>
    >({
      method: "POST",
      url: `/api/v1/projects/general/metric/`,
      data: payload,
      requireToken: true,
    });

    console.log(response);
    toast.success("Creation successful!");
  } catch (error: unknown) {
    throw error;
  }
};

export const CreateChannel = async (
  payload: CreateChannelPayload,
): Promise<void> => {
  const name = payload.name.trim();
  if (!name) {
    throw new Error("Channel name cannot be blank.");
  }

  try {
    const { data: response } = await apiRequest<
      ApiRequestResponse<ApiResponse>
    >({
      method: "POST",
      url: `/api/v1/projects/general/airplay/`,
      data: {
        name,
        impressions: payload.impressions,
        audience: payload.audience,
        channel: payload.channel,
        metric_ids: payload.metric_ids,
      },
      requireToken: true,
    });

    console.log(response);
    toast.success("Creation successful!");
  } catch (error: unknown) {
    throw error;
  }
};

export const CreateSocialStats = async (
  id: number,
  payload: unknown,
  options: ToastOptions = {},
): Promise<void> => {
  const { showToast = true } = options;

  try {
    const { data: response } = await apiRequest<
      ApiRequestResponse<ApiResponse>
    >({
      method: "POST",
      url: `/api/v1/projects/${id}/social-media/`,
      data: payload,
      requireToken: true,
    });

    console.log(response);
    if (showToast) toast.success("Creation successful!");
  } catch (error: unknown) {
    throw error;
  }
};

export const CreateDspStats = async (
  id: number,
  payload: unknown,
  options: ToastOptions = {},
): Promise<void> => {
  const { showToast = true } = options;

  try {
    const { data: response } = await apiRequest<
      ApiRequestResponse<ApiResponse>
    >({
      method: "POST",
      url: `/api/v1/projects/${id}/dsp/`,
      data: payload,
      requireToken: true,
    });

    console.log(response);
    if (showToast) toast.success("Creation successful!");
  } catch (error: unknown) {
    throw error;
  }
};

const updateProjectStat = async (
  url: string,
  payload: UpdateStatPayload,
  options: ToastOptions = {},
): Promise<void> => {
  const { showToast = true } = options;

  try {
    const { data: response } = await apiRequest<
      ApiRequestResponse<ApiResponse>
    >({
      method: "PATCH",
      url,
      data: payload,
      requireToken: true,
    });

    console.log(response);
    if (showToast) toast.success("Update successful!");
  } catch (error: unknown) {
    throw error;
  }
};

export const UpdateAirplayStat = async (
  statId: number,
  payload: UpdateStatPayload,
  options?: ToastOptions,
): Promise<void> =>
  updateProjectStat(
    `/api/v1/projects/stats/air-plays/${statId}/`,
    payload,
    options,
  );

export const UpdateSocialMediaStat = async (
  statId: number,
  payload: UpdateStatPayload,
  options?: ToastOptions,
): Promise<void> =>
  updateProjectStat(
    `/api/v1/projects/stats/social-media/${statId}/`,
    payload,
    options,
  );

export const UpdateDspStat = async (
  statId: number,
  payload: UpdateStatPayload,
  options?: ToastOptions,
): Promise<void> =>
  updateProjectStat(`/api/v1/projects/stats/dsp/${statId}/`, payload, options);

export const getAirPlayStats = async ({
  id,
  weeks = "",
  lifetime = "",
  channels = "",
  country = "",
}: {
  id: number;
  weeks?: string;
  lifetime?: string;
  channels?: string;
  country?: string;
}): Promise<any | null> => {
  try {
    const params: Record<string, string | number> = { id };
    if (weeks) params.weeks = weeks;
    if (lifetime) params.lifetime = lifetime;
    if (country) params.country = country;
    if (channels) params.channels = channels;

    const response = await apiRequest<any>({
      method: "GET",
      url: `/api/campaigns/${id}/get-airplay-stats`,
      params,
      data: null,
      requireToken: true,
    });

    if (response && typeof response === "object") {
      const airPlayStats: any = response;
      ls.set(`AirPlayStats_${id}`, airPlayStats, { encrypt: true });
      return airPlayStats;
    } else {
      console.error("Invalid DSP stats response structure:", response);
      return null;
    }
  } catch (error: unknown) {
    return null;
  }
};

export const getSocialMediaStats = async ({
  id,
  weeks = "",
  lifetime = "",
  channels = "",
  country = "",
}: {
  id: number;
  weeks?: string;
  lifetime?: string;
  channels?: string;
  country?: string;
}): Promise<any | null> => {
  try {
    const params: Record<string, string | number> = { id };
    if (weeks) params.weeks = weeks;
    if (lifetime) params.lifetime = lifetime;
    if (country) params.country = country;
    if (channels) params.channels = channels;

    const response = await apiRequest<any>({
      method: "GET",
      url: `/api/campaigns/${id}/get-social-media-stats`,
      params,
      data: null,
      requireToken: true,
    });

    if (response && typeof response === "object") {
      const airPlayStats: any = response;
      ls.set(`AirPlayStats_${id}`, airPlayStats, { encrypt: true });
      return airPlayStats;
    } else {
      console.error("Invalid DSP stats response structure:", response);
      return null;
    }
  } catch (error: unknown) {
    return null;
  }
};

export const getDSPStats = async ({
  id,
  weeks = "",
  lifetime = "",
  channels = "",
  country = "",
}: {
  id: number;
  weeks?: string;
  lifetime?: string;
  channels?: string;
  country?: string;
}): Promise<any | null> => {
  try {
    const params: Record<string, string | number> = { id };
    if (weeks) params.weeks = weeks;
    if (lifetime) params.lifetime = lifetime;
    if (country) params.country = country;
    if (channels) params.channels = channels;

    const response = await apiRequest<any>({
      method: "GET",
      url: `/api/campaigns/${id}/get-dsp-stats`,
      params,
      data: null,
      requireToken: true,
    });

    if (response && typeof response === "object") {
      const airPlayStats: any = response;
      ls.set(`AirPlayStats_${id}`, airPlayStats, { encrypt: true });
      return airPlayStats;
    } else {
      console.error("Invalid DSP stats response structure:", response);
      return null;
    }
  } catch (error: unknown) {
    return null;
  }
};

export const getAudienceStats = async ({
  id,
  weeks = "",
  lifetime = "",
  channels = "",
  country = "",
}: {
  id: number;
  weeks?: string;
  lifetime?: string;
  channels?: string;
  country?: string;
}): Promise<any | null> => {
  try {
    const params: Record<string, string | number> = { id };
    if (weeks) params.weeks = weeks;
    if (lifetime) params.lifetime = lifetime;
    if (country) params.country = country;
    if (channels) params.channels = channels;

    const response = await apiRequest<any>({
      method: "GET",
      url: `/api/campaigns/${id}/audience-stats`,
      params,
      data: null,
      requireToken: true,
    });

    if (response && typeof response === "object") {
      const airPlayStats: any = response;
      ls.set(`AirPlayStats_${id}`, airPlayStats, { encrypt: true });
      return airPlayStats;
    } else {
      console.error("Invalid DSP stats response structure:", response);
      return null;
    }
  } catch (error: unknown) {
    return null;
  }
};

export const geteSMActionStats = async ({
  id,
  weeks = "",
  lifetime = "",
  channels = "",
  country = "",
}: {
  id: number;
  weeks?: string;
  lifetime?: string;
  channels?: string;
  country?: string;
}): Promise<any | null> => {
  try {
    const params: Record<string, string | number> = { id };
    if (weeks) params.weeks = weeks;
    if (lifetime) params.lifetime = lifetime;
    if (country) params.country = country;
    if (channels) params.channels = channels;

    const response = await apiRequest<any>({
      method: "GET",
      url: `/api/campaigns/${id}/sm-actions-stats`,
      params,
      data: null,
      requireToken: true,
    });

    if (response && typeof response === "object") {
      const airPlayStats: any = response;
      ls.set(`AirPlayStats_${id}`, airPlayStats, { encrypt: true });
      return airPlayStats;
    } else {
      console.error("Invalid DSP stats response structure:", response);
      return null;
    }
  } catch (error: unknown) {
    return null;
  }
};

export const geteDSPPerformanceStats = async ({
  id,
  weeks = "",
  lifetime = "",
  channels = "",
  country = "",
}: {
  id: number;
  weeks?: string;
  lifetime?: string;
  channels?: string;
  country?: string;
}): Promise<any | null> => {
  try {
    const params: Record<string, string | number> = { id };
    if (weeks) params.weeks = weeks;
    if (lifetime) params.lifetime = lifetime;
    if (country) params.country = country;
    if (channels) params.channels = channels;

    const response = await apiRequest<any>({
      method: "GET",
      url: `/api/campaigns/${id}/dsp-performance-stats`,
      params,
      data: null,
      requireToken: true,
    });

    if (response && typeof response === "object") {
      const airPlayStats: any = response;
      ls.set(`AirPlayStats_${id}`, airPlayStats, { encrypt: true });
      return airPlayStats;
    } else {
      console.error("Invalid DSP stats response structure:", response);
      return null;
    }
  } catch (error: unknown) {
    return null;
  }
};

export const AddAirplayData = async (
  payload: unknown,
  id: number,
  options: ToastOptions = {},
): Promise<void> => {
  const { showToast = true } = options;

  try {
    const { data: response } = await apiRequest<
      ApiRequestResponse<ApiResponse>
    >({
      method: "POST",
      url: `/api/v1/projects/${id}/air-plays/`,
      data: payload,
      requireToken: true,
    });

    console.log(response);
    if (showToast) toast.success("Creation successful!");
  } catch (error: unknown) {
    throw error;
  }
};

export const getSpinsAnalytics = async (
  startDate?: string,
  endDate?: string,
): Promise<any | null> => {
  try {
    let url = `/api/spins/chart`;
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }

    const response = await apiRequest({
      method: "GET",
      url: url,
      data: null,
      requireToken: false,
    });

    return response as any;
  } catch (error: unknown) {
    return null;
  }
};

export const getSpinsNotificationPublic = async (
  spinId: string | string[] | undefined,
): Promise<any | null> => {
  try {
    let url = `/api/spins/${spinId}`;

    const response = await apiRequest({
      method: "GET",
      url: url,
      data: null,
      requireToken: false,
    });

    return response as any;
  } catch (error: unknown) {
    return null;
  }
};

export const getCampaignClusters = async (): Promise<any | null> => {
  try {
    let url = `/api/marketplace/clusters`;

    const response = await apiRequest({
      method: "GET",
      url: url,
      data: null,
      requireToken: false,
    });

    return response as any;
  } catch (error: unknown) {
    return null;
  }
};

export const getSystemAudienceReach = async (): Promise<any | null> => {
  try {
    let url = `/api/marketplace/system-reach`;

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

export const getCampaignSongISRC = async (
  song_isrc: string,
): Promise<any | null> => {
  try {
    let url = `/api/marketplace/songs/lookup?isrc=${encodeURIComponent(song_isrc)}`;

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

export const getClusterDjs = async (params?: {
  cluster_id?: number | null;
  search?: string;
}): Promise<any | null> => {
  try {
    let url = `/api/marketplace/djs`;
    const query = new URLSearchParams();

    if (params?.cluster_id != null) {
      query.append("cluster_id", String(params.cluster_id));
    }
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
