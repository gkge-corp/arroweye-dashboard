import "server-only";

import { withRetry } from "./fan-out";
import { soundchartsRequest } from "./soundcharts-client";

// Station reach moves slowly, so a ranking is kept for a week.
const RADIO_RANKING_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface TopRadioItem {
  radio?: {
    slug?: string;
    name?: string;
    cityName?: string;
    countryCode?: string;
    reach?: number;
    imageUrl?: string;
  };
}

export interface RankedStation {
  id: string;
  name: string;
  city: string;
  countryCode: string;
  reach: number;
  imageUrl?: string;
}

/** Stations in the given countries, highest reach first. */
export const fetchTopRadios = async (
  countryCodes: string[],
  limit: number,
): Promise<RankedStation[]> => {
  const payload = await withRetry(() =>
    soundchartsRequest<{ items?: TopRadioItem[] }>(
      `/api/v2/top/radios?offset=0&limit=${limit}`,
      {
        ttlMs: RADIO_RANKING_TTL_MS,
        body: {
          sort: {
            platform: "soundcharts",
            metricType: "reach",
            sortBy: "total",
            order: "desc",
          },
          filters: [
            {
              type: "radioCountryCode",
              data: { values: countryCodes, operator: "in" },
            },
          ],
        },
      },
    ),
  );

  return (payload.items ?? []).map(({ radio }) => ({
    id: radio?.slug ?? `${radio?.name}-${radio?.countryCode}`,
    name: radio?.name ?? "Unknown station",
    city: radio?.cityName ?? "",
    countryCode: radio?.countryCode?.toUpperCase() ?? "",
    reach: Number(radio?.reach ?? 0),
    imageUrl: radio?.imageUrl,
  }));
};
