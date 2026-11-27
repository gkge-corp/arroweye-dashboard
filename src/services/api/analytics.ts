import ls from "localstorage-slim";
import apiRequest from "@/Server/Api";

if (typeof window !== "undefined" && window?.localStorage)
  ls.config.storage = localStorage;

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
