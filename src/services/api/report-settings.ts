import apiRequest from "@/Server/Api";

export interface StoredInsightSources {
  playlistPlatforms?: string[];
  reachPlatforms?: string[];
  artistSocialPlatforms?: string[];
  knownStreamingPlatforms?: string[];
}

/** Per-campaign insight settings, shared by the campaign page and the weekly report. */
export interface ReportSettings {
  insight_sources: StoredInsightSources | null;
  /** null = every market with spins; [] = airplay switched off. */
  airplay_markets: string[] | null;
  known_airplay_markets: string[];
}

export type ReportSettingsUpdate = Partial<ReportSettings>;

export const getReportSettings = (campaignId: string | number) =>
  apiRequest<ReportSettings>({
    method: "GET",
    url: `/api/campaigns/${campaignId}/report-settings`,
    requireToken: true,
    silent: true,
  });

export const updateReportSettings = (
  campaignId: string | number,
  changes: ReportSettingsUpdate,
) =>
  apiRequest<ReportSettings>({
    method: "PUT",
    url: `/api/campaigns/${campaignId}/report-settings`,
    data: changes,
    requireToken: true,
  });
