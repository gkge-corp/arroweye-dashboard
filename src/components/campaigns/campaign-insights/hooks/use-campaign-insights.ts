import { useState, useEffect } from "react";
import { ChartData } from "chart.js";
import { usePDF } from "react-to-pdf";
import { CAMPAIGN_AUDIENCE } from "@/lib/campaign-audience";
import getDarkerColor from "@/lib/getDarkerColor";

interface UseCampaignInsightsParams {
  content?: any;
  /** Non-streaming discovery figures displayed beside the DSP bars. */
  discoveryData?: Record<string, number>;
  /**
   * Live figures for the linked recording, the only source the charts read.
   * Without an ISRC every section is absent and the charts render empty.
   */
  stats?: {
    /** Artist follower growth per network over the campaign. */
    socialMedia?: Record<string, number>;
    /** Views, likes, comments and shares gained over the campaign. */
    actions?: Record<string, number>;
    dsp?: Record<string, number>;
    /** Spins per country for the markets the user selected. */
    airplayByCountry?: Record<string, number>;
    performance?: Record<string, number>;
  };
}

type DoughnutChartData = {
  labels?: string[];
  datasets: Array<{
    data?: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
};

const campaignChartPalette = [
  "#ff5c7a",
  "#38a8ff",
  "#ffc247",
  "#4ecdc4",
  "#8b5cf6",
  "#ff7a1a",
  "#22c55e",
  "#ec4899",
];

const getCampaignChartColors = (count: number) =>
  Array.from(
    { length: count },
    (_, index) => campaignChartPalette[index % campaignChartPalette.length],
  );

const emptyInsightData: Record<string, number> = {};

export function useCampaignInsights({
  content,
  discoveryData,
  stats,
}: UseCampaignInsightsParams) {
  const [initialTab, setInitialTab] = useState<any>("moments");
  const [addMediaModal, setAddMediaModal] = useState(false);
  const [momentMediaData, setMomentMediaData] = useState<any>([]);
  const [momentReportUrls, setMomentReportUrls] = useState<any>([]);
  const [giftingsReportUrls, setGiftingsReportUrls] = useState<any>([]);
  const [recapMediaData, setRecapMediaData] = useState<any>([]);
  const [dspMediaData, setDspMediaData] = useState<any>([]);

  const media = content?.media || [];
  const mediaLoading = !content;

  const airPlayData = stats?.airplayByCountry ?? emptyInsightData;
  const socialMediaData = stats?.socialMedia ?? emptyInsightData;
  const smactionData = stats?.actions ?? emptyInsightData;
  const dspData = stats?.dsp ?? emptyInsightData;
  const dspPerformanceData = stats?.performance ?? emptyInsightData;
  const audienceData = CAMPAIGN_AUDIENCE;

  const generateDoughnutChartData = (
    data: Record<string, number>,
  ): DoughnutChartData => {
    const filteredEntries = Object.entries(data).filter(
      ([key]) => key !== "total_count",
    );

    if (filteredEntries.length === 0) {
      return {
        labels: ["Total Count"],
        datasets: [
          {
            data: [data.total_count],
            backgroundColor: ["#d4d4d4"],
            borderWidth: 1,
            borderColor: getDarkerColor(["#d4d4d4"], 20),
          },
        ],
      };
    }

    const labels = filteredEntries.map(([key]) => key);
    const values = filteredEntries.map(([_, value]) => value);

    const backgroundColors = getCampaignChartColors(labels.length);
    const borderColors = getDarkerColor(backgroundColors, 20);

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          borderColor: borderColors,
        },
      ],
    };
  };

  const chartDataForDoughnutAirplay =
    airPlayData && generateDoughnutChartData(airPlayData);

  const chartDataForDoughnutSMAction =
    smactionData && generateDoughnutChartData(smactionData);

  const generatePieChartData = (
    data: Record<string, number>,
  ): ChartData<"pie", number[], string> => {
    const filteredEntries = Object.entries(data).filter(
      ([key]) => key !== "total_count",
    );

    if (filteredEntries.length === 0) {
      return {
        labels: ["Total Count"],
        datasets: [
          {
            label: "Total",
            data: [data.total_count],
            backgroundColor: ["#d4d4d4"],
            borderWidth: 1,
            borderColor: getDarkerColor(["#d4d4d4"], 20),
          },
        ],
      };
    }

    const labels = filteredEntries.map(([key]) => key);
    const values = filteredEntries.map(([_, value]) => value);

    const backgroundColors = getCampaignChartColors(labels.length);
    const borderColors = getDarkerColor(backgroundColors, 20);

    return {
      labels,
      datasets: [
        {
          label: "Social Media",
          data: values,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          borderColor: borderColors,
          borderAlign: "inner",
        },
      ],
    };
  };

  const chartDataForPie =
    socialMediaData && generatePieChartData(socialMediaData);

  const pieChartDataAudience =
    audienceData && generatePieChartData(audienceData);

  const pieChartDataDSPPerformance =
    dspPerformanceData && generatePieChartData(dspPerformanceData);

  const generateBarChartData = (
    data: Record<string, number>,
  ): ChartData<"bar", number[], string> => {
    const filteredEntries = Object.entries(data).filter(
      ([key]) => key !== "total_count",
    );

    if (filteredEntries.length === 0) {
      return {
        labels: ["Total Count"],
        datasets: [
          {
            label: "Total",
            data: [data.total_count],
            backgroundColor: ["#d4d4d4"],
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 1)",
          },
        ],
      };
    }

    const labels = filteredEntries.map(([key]) => key);
    const values = filteredEntries.map(([_, value]) => value);

    const backgroundColors = getCampaignChartColors(labels.length);

    return {
      labels,
      datasets: [
        {
          label: "Platform Usage",
          data: values,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 1)",
        },
      ],
    };
  };

  // The headline sums every bar shown, discovery signals such as Shazam
  // included, so it never reads 0 above a populated chart.
  const discoveryAndStreamingTotal =
    Number(dspData.total_count ?? 0) +
    Object.values(discoveryData ?? {}).reduce((sum, v) => sum + v, 0);
  const chartDataForBar = generateBarChartData({
    ...dspData,
    ...discoveryData,
    total_count: discoveryAndStreamingTotal,
  });

  const { toPDF, targetRef } = usePDF({ filename: "dashboard.pdf" });

  useEffect(() => {
    const giftings = media.filter((item: any) => item?.type === "Gifting");
    const momentMedia = media.filter((item: any) => item?.type === "Moment");
    const recapMedia = media.filter((item: any) => item?.type === "Recap");
    const dspCoversWithFiles = media.filter(
      (item: any) =>
        item?.type === "DSP_Covers" && item?.files && item.files.length > 0,
    );
    const dspfileUrls = dspCoversWithFiles.flatMap((item: any) =>
      item.files.map(
        (file: any) => `https://studio-api.arroweye.pro${file.file}`,
      ),
    );

    setGiftingsReportUrls(giftings);
    setMomentReportUrls(momentMedia.map((item: any) => item.report));
    setMomentMediaData(momentMedia.map((item: any) => item.embed_link));
    setRecapMediaData(recapMedia.map((item: any) => item.embed_link));
    setDspMediaData(dspfileUrls);
  }, [media]);

  return {
    initialTab,
    setInitialTab,
    addMediaModal,
    setAddMediaModal,
    airPlayData,
    socialMediaData,
    dspData,
    audienceData,
    smactionData,
    dspPerformanceData,
    momentMediaData,
    momentReportUrls,
    giftingsReportUrls,
    recapMediaData,
    dspMediaData,
    mediaLoading,
    chartDataForDoughnutAirplay,
    chartDataForDoughnutSMAction,
    chartDataForPie,
    pieChartDataAudience,
    pieChartDataDSPPerformance,
    chartDataForBar,
    discoveryAndStreamingTotal,
    toPDF,
    targetRef,
  };
}
