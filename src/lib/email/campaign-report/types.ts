import type { RadioMonitorSummary } from "@/lib/radio-monitor/radio-monitor-summary";
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
  radioMonitor?: {
    downloadLink: string;
    fileName: string;
    summary?: RadioMonitorSummary;
    /** Validated model wording with placeholders; absent means the template. */
    wording?: string;
  };
}

export interface MetricCard {
  label: string;
  value: number;
  valuePrefix?: string;
  detailLabel?: string;
  detailValue?: string;
  changePercent?: number | null;
  changePeriodDays?: number;
}
