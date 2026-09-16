export type CampaignReportStats = Record<string, number>;

/**
 * The resolved values shown on the campaign insights page. Soundcharts has
 * already overridden the eligible sections and the remaining sections have
 * fallen back to the Arroweye API before this snapshot is created.
 */
export interface CampaignReportMetrics {
  airplay: CampaignReportStats;
  streaming: CampaignReportStats;
  audience: CampaignReportStats;
  socialMedia: CampaignReportStats;
  actions: CampaignReportStats;
  performance: CampaignReportStats;
  spinCount: number;
}

export interface SendCampaignReportInput {
  campaignId: string;
  recipient: string;
  metrics: CampaignReportMetrics;
}

export interface SendCampaignReportResult {
  success: boolean;
  message: string;
}
