import type { CampaignReportMetrics } from "@/types/campaign-report";

export type UnknownRecord = Record<string, unknown>;

export interface CampaignAiRecommendation {
  title: string;
  body: string;
}

export interface CampaignAiInsights {
  summary: string;
  recommendations: CampaignAiRecommendation[];
}

export interface CampaignReportTemplateInput {
  project: UnknownRecord;
  metrics: CampaignReportMetrics;
  campaignId: string;
  generatedAt: Date;
  aiInsights?: CampaignAiInsights;
}

export interface MetricCard {
  label: string;
  value: number;
  detailLabel?: string;
  detailValue?: string;
  changePercent?: number | null;
  changePeriodDays?: number;
}
