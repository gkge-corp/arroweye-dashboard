"use client";

import React from "react";
import InsightCard from "./InsightCard";
import { ContentItem } from "@/types/contents";
import { useCampaignAudienceGrowth } from "@/hooks/use-campaign-audience-growth";

interface ProjectSingleInsightProps {
  isAdvertiser: boolean | null;
  content: ContentItem | null;
}

const ProjectSingleInsight: React.FC<ProjectSingleInsightProps> = ({
  isAdvertiser,
  content,
}) => {
  function formatNumber(num: any) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  }

  const toDateOnly = (value: unknown) => {
    if (typeof value !== "string" || !value.trim()) return undefined;
    const datePrefix = value.trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (datePrefix) return datePrefix;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? undefined
      : date.toISOString().slice(0, 10);
  };

  const campaignStartDate = toDateOnly(
    content?.start_dte ??
      (content as any)?.start_date ??
      (content as any)?.campaign?.start_date ??
      content?.created,
  );
  const campaignEndDate = toDateOnly(
    content?.end_dte ??
      (content as any)?.end_date ??
      (content as any)?.campaign?.end_date,
  );
  const campaignIsrc =
    (content as any)?.isrc || (content as any)?.song_isrc || undefined;
  const { audienceGrowth, isAudienceGrowthLoading } = useCampaignAudienceGrowth(
    {
      isrc: campaignIsrc,
      startDate: campaignStartDate,
      endDate: campaignEndDate,
      enabled: isAdvertiser === false,
    },
  );
  const soundchartsAudienceGrowth = audienceGrowth?.available
    ? audienceGrowth.totalGrowth
    : null;
  const formattedAudienceGrowth = isAudienceGrowthLoading
    ? "…"
    : soundchartsAudienceGrowth === null
      ? "—"
      : `${soundchartsAudienceGrowth > 0 ? "+ " : soundchartsAudienceGrowth < 0 ? "− " : ""}${formatNumber(Math.abs(soundchartsAudienceGrowth))}`;
  const audienceGrowthPercentage =
    audienceGrowth?.changePercent === null ||
    audienceGrowth?.changePercent === undefined
      ? undefined
      : Math.abs(audienceGrowth.changePercent).toFixed(1);

  return (
    <div className="mt-[20px] relative font-SansFlex">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[10px] 2xl:gap-[20px] relative">
        <div className="w-full">
          <InsightCard
            title="TOTAL INVESTMENT"
            currency={<>{!isAdvertiser ? "$" : "₦"}</>}
            value={
              !isAdvertiser
                ? formatNumber(content?.total_investment || 0)
                : formatNumber(content?.kpis?.total_investment_naira || 0)
            }
            extraClass="h-[220px]"
            percentageColor="#11cc48"
            info="This represents the total amount invoiced for executing this campaign. You can download the invoice under the 'Payments' section."
          />
        </div>
        <div className=" w-full">
          <InsightCard
            title="TOTAL REVENUE"
            currency={<>{!isAdvertiser ? "$" : "₦"}</>}
            value={
              !isAdvertiser
                ? formatNumber(content?.total_revenue?.minimum || 0)
                : formatNumber(content?.kpis?.estimated_revenue_min_naira || 0)
            }
            maxValue={
              !isAdvertiser
                ? formatNumber(content?.total_revenue?.maximum || 0)
                : formatNumber(content?.kpis?.estimated_revenue_max_naira || 0)
            }
            extraClass="h-[220px]"
            percentageChange={content?.total_revenue?.percentage}
            percentageColor={
              content?.total_revenue?.change === "increase"
                ? "#11cc48"
                : "#ff4d4f"
            }
            increaseType={content?.total_revenue?.change}
            info="This is the estimated revenue range generated from streams, purchases, and views for this campaign. These figures are estimates; please confirm the actual revenue with your distributor."
          />
        </div>

        <div className="w-full">
          <InsightCard
            title={!isAdvertiser ? "AUDIENCE GROWTH" : "SHAZAMS"}
            value={
              !isAdvertiser
                ? formattedAudienceGrowth
                : content?.kpis?.shazams_count
            }
            extraClass="h-[220px]"
            percentageChange={
              !isAdvertiser
                ? audienceGrowthPercentage
                : content?.total_audience_growth?.percentage
            }
            percentageColor={
              (soundchartsAudienceGrowth ?? 0) >= 0 ? "#11cc48" : "#ff4d4f"
            }
            increaseType={
              (soundchartsAudienceGrowth ?? 0) >= 0 ? "increase" : "decrease"
            }
            info={
              !isAdvertiser
                ? "Net change in the artist's followers and subscribers across tracked platforms during this campaign"
                : "The total number of Shazams during this campaign"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectSingleInsight;
