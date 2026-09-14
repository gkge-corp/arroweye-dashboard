import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChartData } from "chart.js";
import { usePDF } from "react-to-pdf";
import {
  getAirPlayStats,
  getSocialMediaStats,
  getDSPStats,
  getAudienceStats,
  geteSMActionStats,
  geteDSPPerformanceStats,
} from "@/services";
import getDarkerColor from "@/lib/getDarkerColor";

interface UseCampaignInsightsParams {
  content?: any;
  refreshContent?: () => void;
  /**
   * Live figures from Soundcharts for the linked recording. Any section
   * present here replaces the hand-entered numbers from the Arroweye API;
   * sections Soundcharts cannot supply fall through to the manual data.
   */
  statsOverrides?: {
    socialMedia?: Record<string, number>;
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

type InsightStats = Record<string, number>;

type CampaignInsightsData = {
  airPlayData: InsightStats;
  socialMediaData: InsightStats;
  dspData: InsightStats;
  audienceData: InsightStats;
  smactionData: InsightStats;
  dspPerformanceData: InsightStats;
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
const emptyCampaignInsightsData: CampaignInsightsData = {
  airPlayData: emptyInsightData,
  socialMediaData: emptyInsightData,
  dspData: emptyInsightData,
  audienceData: emptyInsightData,
  smactionData: emptyInsightData,
  dspPerformanceData: emptyInsightData,
};

export function useCampaignInsights({
  content,
  refreshContent,
  statsOverrides,
}: UseCampaignInsightsParams) {
  const queryClient = useQueryClient();
  const [initialTab, setInitialTab] = useState<any>("moments");
  const [addDataModal, setAddDataModal] = useState(false);
  const [addDataModalSocial, setAddDataModalSocial] = useState(false);
  const [addMediaModal, setAddMediaModal] = useState(false);
  const [addDspModal, setAddDspModal] = useState(false);
  const [momentMediaData, setMomentMediaData] = useState<any>([]);
  const [momentReportUrls, setMomentReportUrls] = useState<any>([]);
  const [giftingsReportUrls, setGiftingsReportUrls] = useState<any>([]);
  const [recapMediaData, setRecapMediaData] = useState<any>([]);
  const [dspMediaData, setDspMediaData] = useState<any>([]);

  const media = content?.media || [];
  const mediaLoading = !content;
  const { id } = useParams<{ id: string }>();
  const campaignId = Number(id);
  const hasCampaignId = Boolean(id) && Number.isFinite(campaignId);

  const [airplayChannelsFilters, setairplayChannelsFilters] = useState({
    country: "",
    weeks: "",
    lifetime: "",
  });

  const [airplayAudienceFilters, setairplayAudienceFilters] = useState({
    channels: "",
    weeks: "",
    lifetime: "",
  });

  const [socialMediaPlatformFilters, setSocialMediaPlatformFilters] = useState({
    weeks: "",
    lifetime: "",
  });

  const [socialMediaActionsFilters, setSocialMediaActionsFilters] = useState({
    weeks: "",
    lifetime: "",
  });

  const [dspFilters, setDspFilters] = useState({
    weeks: "",
    lifetime: "",
  });

  const [dspPerformanceFilters, setDspPerformanceFilters] = useState({
    weeks: "",
    lifetime: "",
  });

  const {
    data: insightsData = emptyCampaignInsightsData,
    isLoading: isInsightsDataLoading,
  } = useQuery<CampaignInsightsData>({
    queryKey: [
      "campaign-insights",
      campaignId,
      {
        airplayChannelsFilters,
        airplayAudienceFilters,
        socialMediaPlatformFilters,
        socialMediaActionsFilters,
        dspFilters,
        dspPerformanceFilters,
      },
    ],
    queryFn: async () => {
      const [
        airPlayData,
        socialMediaData,
        dspData,
        audienceData,
        smactionData,
        dspPerformanceData,
      ] = await Promise.all([
        getAirPlayStats({ id: campaignId, ...airplayChannelsFilters }),
        getSocialMediaStats({ id: campaignId, ...socialMediaPlatformFilters }),
        getDSPStats({ id: campaignId, ...dspFilters }),
        getAudienceStats({ id: campaignId, ...airplayAudienceFilters }),
        geteSMActionStats({
          id: campaignId,
          ...socialMediaActionsFilters,
        }),
        geteDSPPerformanceStats({
          id: campaignId,
          ...dspPerformanceFilters,
        }),
      ]);

      return {
        airPlayData: airPlayData ?? {},
        socialMediaData: socialMediaData ?? {},
        dspData: dspData ?? {},
        audienceData: audienceData ?? {},
        smactionData: smactionData ?? {},
        dspPerformanceData: dspPerformanceData ?? {},
      };
    },
    enabled: hasCampaignId,
  });

  const {
    airPlayData: manualAirPlayData = emptyInsightData,
    socialMediaData: manualSocialMediaData = emptyInsightData,
    dspData: manualDspData = emptyInsightData,
    audienceData = emptyInsightData,
    smactionData = emptyInsightData,
    dspPerformanceData: manualDspPerformanceData = emptyInsightData,
  } = insightsData;

  // An override only wins when it actually carries figures, so a song with no
  // Soundcharts presence still shows whatever ops entered by hand.
  const preferLive = (
    live: Record<string, number> | undefined,
    manual: Record<string, number>,
  ) => (live && Number(live.total_count) > 0 ? live : manual);

  const socialMediaData = preferLive(
    statsOverrides?.socialMedia,
    manualSocialMediaData,
  );
  const dspData = preferLive(statsOverrides?.dsp, manualDspData);
  const dspPerformanceData = preferLive(
    statsOverrides?.performance,
    manualDspPerformanceData,
  );

  // AIRPLAY breaks down by country when Soundcharts has radio data for the
  // linked song. An explicit empty map means the user cleared every country.
  const airPlayData = statsOverrides?.airplayByCountry ?? manualAirPlayData;

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

  const chartDataForBar = generateBarChartData(dspData);

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

  const invalidateCampaignInsights = () => {
    queryClient.invalidateQueries({
      queryKey: ["campaign-insights", campaignId],
    });
  };

  const onAddSocialMediaDataSuccess = () => {
    invalidateCampaignInsights();
    refreshContent?.();
  };

  const onAddDataSuccess = () => {
    invalidateCampaignInsights();
    refreshContent?.();
  };

  const onAddDataDspSuccess = () => {
    invalidateCampaignInsights();
    refreshContent?.();
  };

  return {
    initialTab,
    setInitialTab,
    addDataModal,
    setAddDataModal,
    addDataModalSocial,
    setAddDataModalSocial,
    addMediaModal,
    setAddMediaModal,
    addDspModal,
    setAddDspModal,
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
    airplayChannelsFilters,
    setairplayChannelsFilters,
    airplayAudienceFilters,
    setairplayAudienceFilters,
    socialMediaPlatformFilters,
    setSocialMediaPlatformFilters,
    socialMediaActionsFilters,
    setSocialMediaActionsFilters,
    dspFilters,
    setDspFilters,
    dspPerformanceFilters,
    setDspPerformanceFilters,
    chartDataForDoughnutAirplay,
    chartDataForDoughnutSMAction,
    chartDataForPie,
    pieChartDataAudience,
    pieChartDataDSPPerformance,
    chartDataForBar,
    isAirPlayDataLoading: isInsightsDataLoading,
    isSocialMediaDataLoading: isInsightsDataLoading,
    isDspDataLoading: isInsightsDataLoading,
    isAudienceDataLoading: isInsightsDataLoading,
    isSmActionDataLoading: isInsightsDataLoading,
    isDspPerformanceDataLoading: isInsightsDataLoading,
    onAddSocialMediaDataSuccess,
    onAddDataSuccess,
    onAddDataDspSuccess,
    toPDF,
    targetRef,
  };
}
