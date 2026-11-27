import apiRequest from "@/Server/Api";
import type { ArtistPage, ArtistPageData } from "@/types/api";

// Public: the canvas page loads artists without a session.
export const getArtists = async (): Promise<ArtistPage> =>
  apiRequest<ArtistPage>({
    method: "GET",
    url: "/api/artists",
    params: { page_size: 1000 },
    requireToken: false,
  });

export const getArtistPage = async (slug: string): Promise<ArtistPageData> =>
  apiRequest<ArtistPageData>({
    method: "GET",
    url: `/api/artists/${encodeURIComponent(slug)}`,
    requireToken: false,
    // The page shows its own not-found state instead of a toast.
    skipErrorHandling: true,
  });
