"use client";
import React from "react";
import AddMedia from "../AddMedia";
import { Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PieChart from "@/app/(dashboard)/payments/component/PieChart";
import DoughnutChart from "../Doughnut";
import ColumnChart from "../ColumnChart";

import { BottomDock } from "./bottom-dock";
import { PlaylistsCard } from "./playlists-card";
import { LinkSongDialog } from "./link-song-dialog";
import {
  InsightSourcesDialog,
  type InsightSourceScope,
} from "./insight-sources-dialog";
import { useCampaignInsights } from "./hooks/use-campaign-insights";
import { useCampaignSong } from "@/hooks/use-campaign-song";
import { useCampaignAudienceGrowth } from "@/hooks/use-campaign-audience-growth";
import { useCampaignPlaylists } from "./hooks/use-campaign-playlists";
import { useCampaignRadio } from "./hooks/use-campaign-radio";
import { useCampaignSocialTraction } from "./hooks/use-campaign-social-traction";
import { useCampaignTopCreators } from "./hooks/use-campaign-top-creators";
import { useCampaignInsightStats } from "./hooks/use-campaign-insight-stats";
import {
  deriveAirplayMarkets,
  useAirplayMarkets,
} from "@/hooks/use-airplay-markets";
import {
  mergeStreamingPlatforms,
  resolveStreamingSelection,
  useInsightSources,
} from "@/hooks/use-insight-sources";
import { TopRadioCard } from "./top-radio-card";
import { TopCreatorsCard } from "./top-creators-card";
import type { CampaignReportMetrics } from "@/types/campaign-report";
import { PLAYLIST_PLATFORMS } from "@/lib/music-analytics/platforms";

const videoCreationPlatformIds = new Set(["tiktok", "instagram"]);
const playlistPlatformCodes = new Set(
  PLAYLIST_PLATFORMS.map((platform) => platform.code),
);

const toDateOnly = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const datePrefix = value.trim().match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePrefix) return datePrefix;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().slice(0, 10);
};

const editActionButtonClassName =
  "h-11 w-full justify-start rounded-[8px] border-zinc-300 !bg-white px-5 text-sm font-medium !text-zinc-950 shadow-none hover:!bg-zinc-100 hover:!text-zinc-950 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-violet-500/25";

interface InsightChartProps {
  editMode?: boolean;
  handleDownloadPage?: () => void;
  handleDownloadData?: () => void;
  isAdvertiser?: boolean | null;
  content?: any;
  refreshContent?: () => void;
  onRequestEditModeChange?: (enabled: boolean) => void;
}

const CampaignInsights: React.FC<InsightChartProps> = ({
  editMode = false,
  handleDownloadPage,
  handleDownloadData,
  isAdvertiser,
  content,
  refreshContent,
  onRequestEditModeChange,
}) => {
  const [linkSongModal, setLinkSongModal] = React.useState(false);
  const { songIsrc: linkedIsrc, linkSong } = useCampaignSong({
    campaignId: content?.id,
    isrc: content?.isrc,
    onSaved: refreshContent,
  });
  const campaignStartDate = toDateOnly(
    content?.start_dte ??
      content?.start_date ??
      content?.campaign?.start_date ??
      content?.created,
  );
  const campaignEndDate = toDateOnly(
    content?.end_dte ?? content?.end_date ?? content?.campaign?.end_date,
  );
  const songIsrc = linkedIsrc || content?.song_isrc || undefined;
  const openLinkSong = songIsrc
    ? undefined
    : () => onRequestEditModeChange?.(true);
  const { audienceGrowth, isAudienceGrowthLoading } = useCampaignAudienceGrowth(
    {
      isrc: songIsrc,
      startDate: campaignStartDate,
      endDate: campaignEndDate,
      enabled: isAdvertiser === false,
    },
  );
  const hasIsrc = Boolean(songIsrc);
  const [sourcesModal, setSourcesModal] = React.useState(false);
  const [sourcesScope, setSourcesScope] =
    React.useState<InsightSourceScope>("airplay");
  const {
    sources,
    isLoaded: sourcesLoaded,
    saveSources,
  } = useInsightSources(content?.id);
  const {
    selected: selectedMarkets,
    isLoaded: marketsLoaded,
    airplayDisabled,
    knownMarkets,
    rememberMarkets,
    setMarkets,
  } = useAirplayMarkets(content?.id);

  const openSources = (scope: InsightSourceScope) => {
    setSourcesScope(scope);
    setSourcesModal(true);
  };

  const { insightStats, isInsightStatsLoading } = useCampaignInsightStats(
    songIsrc,
    {
      // Switching every market off skips the airplay call, but that call is the
      // only source of the country list. With nothing remembered yet the picker
      // would have nothing to offer, so it is fetched once to fill the cache and
      // skipped on every load after that.
      radio: !airplayDisabled || knownMarkets.length === 0,
      social: true,
      reachPlatforms: sources.reachPlatforms,
      countries: selectedMarkets,
      startDate: campaignStartDate,
      endDate: campaignEndDate,
      ready: sourcesLoaded && marketsLoaded,
    },
  );
  const { socialTraction, socialTractionPeriodDays, isSocialTractionLoading } =
    useCampaignSocialTraction(songIsrc);
  const { topCreators, isTopCreatorsLoading } =
    useCampaignTopCreators(songIsrc);
  const shazamRow = socialTraction.find((item) => item.id === "shazam");
  // STREAMING counts Shazams gained during the campaign, so the campaign
  // figure wins over the all-time count in the traction data.
  const shazamValue =
    typeof insightStats?.dsp?.Shazam === "number"
      ? insightStats.dsp.Shazam
      : typeof shazamRow?.value === "number"
        ? shazamRow.value
        : null;

  // Songstats reports plays for platforms with no playlist list (SoundCloud),
  // so the STREAMING chart can show more than the playlist picker lists.
  // Hiding is applied here rather than in the route so toggling a platform
  // costs no further calls.
  const streamingOptions = React.useMemo(
    () => mergeStreamingPlatforms(insightStats?.availableStreamingPlatforms),
    [insightStats?.availableStreamingPlatforms],
  );
  const visibleStreamingLabels = React.useMemo(() => {
    const selected = new Set(
      resolveStreamingSelection(sources, streamingOptions),
    );
    return new Set(
      streamingOptions
        .filter((platform) => selected.has(platform.code))
        .map((platform) => platform.label),
    );
  }, [sources, streamingOptions]);
  const visibleDsp = React.useMemo(() => {
    const dsp = insightStats?.dsp;
    if (!dsp) return undefined;

    const kept = Object.entries(dsp).filter(
      ([label]) =>
        label !== "total_count" &&
        label !== "Shazam" &&
        visibleStreamingLabels.has(label),
    );
    return {
      ...Object.fromEntries(kept),
      total_count: kept.reduce((sum, [, value]) => sum + Number(value), 0),
    };
  }, [insightStats?.dsp, visibleStreamingLabels]);
  const discoveryChartData = React.useMemo(
    () =>
      visibleStreamingLabels.has("Shazam") &&
      shazamValue !== null &&
      shazamValue > 0
        ? { Shazam: shazamValue }
        : undefined,
    [shazamValue, visibleStreamingLabels],
  );
  const {
    availableMarkets,
    activeMarkets,
    airplayData: airplayMarketData,
  } = React.useMemo(
    () =>
      deriveAirplayMarkets(
        selectedMarkets,
        insightStats?.availableAirplayCountries ??
          insightStats?.airplayByCountry,
      ),
    [
      selectedMarkets,
      insightStats?.availableAirplayCountries,
      insightStats?.airplayByCountry,
    ],
  );

  React.useEffect(() => {
    if (availableMarkets.length > 0) rememberMarkets(availableMarkets);
  }, [availableMarkets, rememberMarkets]);

  // The airplay call is skipped while every market is off, so the picker falls
  // back to the countries last seen — otherwise switching them all off would
  // leave an empty list and no way to switch any back on. Otherwise only live
  // markets are offered: a remembered country with no spins can never be
  // applied, so ticking it would silently do nothing.
  const pickerMarkets =
    availableMarkets.length > 0
      ? availableMarkets
      : airplayDisabled
        ? knownMarkets
        : [];

  const {
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
    chartDataForDoughnutAirplay,
    chartDataForDoughnutSMAction,
    chartDataForPie,
    pieChartDataAudience,
    pieChartDataDSPPerformance,
    chartDataForBar,
    discoveryAndStreamingTotal,
    targetRef,
  } = useCampaignInsights({
    content,
    discoveryData: discoveryChartData,
    stats: {
      ...insightStats,
      dsp: visibleDsp,
      airplayByCountry: airplayDisabled
        ? { total_count: 0 }
        : airplayMarketData.total_count > 0
          ? airplayMarketData
          : undefined,
    },
  });

  const {
    playlists,
    failedPlatforms,
    isPlaylistsLoading,
    isLoadingMore,
    hasMorePlaylists,
    loadMorePlaylists,
    retryPlaylists,
  } = useCampaignPlaylists(songIsrc, {
    platforms: sources.playlistPlatforms.filter((code) =>
      playlistPlatformCodes.has(code),
    ),
    ready: sourcesLoaded && marketsLoaded,
  });
  const {
    stations,
    isRadioLoading,
    isLoadingMoreRadio,
    hasMoreRadio,
    loadMoreRadio,
  } = useCampaignRadio(songIsrc, {
    enabled: marketsLoaded && !airplayDisabled,
    countries: selectedMarkets,
    startDate: campaignStartDate,
    endDate: campaignEndDate,
  });
  const songTitle =
    content?.title || content?.song_title || content?.campaign?.song_title;
  const reportMetrics = React.useMemo<CampaignReportMetrics>(() => {
    const creationRows = socialTraction.filter(
      (row) =>
        videoCreationPlatformIds.has(row.id) && typeof row.value === "number",
    );
    const videoCreations = creationRows.reduce(
      (sum, row) => sum + (row.value ?? 0),
      0,
    );
    const topCreationPlatform = creationRows
      .filter((row) => (row.value ?? 0) > 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0]?.platform;
    const hasCompleteEvolution =
      creationRows.length > 0 &&
      creationRows.every((row) => typeof row.evolution === "number");
    const creationEvolution = hasCompleteEvolution
      ? creationRows.reduce((sum, row) => sum + (row.evolution ?? 0), 0)
      : null;
    const previousVideoCreations =
      creationEvolution === null ? null : videoCreations - creationEvolution;
    const videoCreationChange =
      creationRows.length === 1 &&
      typeof creationRows[0].percentEvolution === "number"
        ? creationRows[0].percentEvolution
        : previousVideoCreations !== null && previousVideoCreations > 0
          ? (creationEvolution! / previousVideoCreations) * 100
          : creationEvolution === 0
            ? 0
            : null;
    const shazamRow = socialTraction.find((item) => item.id === "shazam");
    const youtubeRow = socialTraction.find((item) => item.id === "youtube");

    return {
      airplay: airPlayData ?? {},
      streaming: dspData ?? {},
      audience: audienceData ?? {},
      socialMedia: socialMediaData ?? {},
      actions: smactionData ?? {},
      performance: dspPerformanceData ?? {},
      spinCount: Number(content?.spin_count ?? 0),
      topRadio: stations[0]?.name,
      audienceGrowth:
        audienceGrowth?.available && audienceGrowth.totalGrowth !== null
          ? {
              totalGrowth: audienceGrowth.totalGrowth,
              topPlatform:
                audienceGrowth.topPlatform?.toLowerCase() === "others"
                  ? undefined
                  : (audienceGrowth.topPlatform ?? undefined),
            }
          : undefined,
      highlights: [
        ...(creationRows.length > 0
          ? [
              {
                id: "videoCreations" as const,
                value: videoCreations,
                changePercent: videoCreationChange,
                periodDays: socialTractionPeriodDays,
                topPlatform: topCreationPlatform,
              },
            ]
          : []),
        ...(shazamValue !== null
          ? [
              {
                id: "shazam" as const,
                value: shazamValue,
                changePercent: shazamRow?.percentEvolution ?? null,
                periodDays: socialTractionPeriodDays,
                topMarket: shazamRow?.topMarket ?? undefined,
              },
            ]
          : []),
        ...(typeof youtubeRow?.value === "number"
          ? [
              {
                id: "youtube" as const,
                value: youtubeRow.value,
                changePercent: youtubeRow.percentEvolution,
                periodDays: socialTractionPeriodDays,
              },
            ]
          : []),
      ],
    };
  }, [
    airPlayData,
    audienceGrowth,
    audienceData,
    content?.spin_count,
    dspData,
    dspPerformanceData,
    smactionData,
    socialMediaData,
    socialTraction,
    socialTractionPeriodDays,
    shazamValue,
    stations,
  ]);
  const reportLoading =
    isAudienceGrowthLoading ||
    Boolean(
      songIsrc &&
      (isInsightStatsLoading || isRadioLoading || isSocialTractionLoading),
    );
  const insightGridClass = editMode
    ? "grid grid-cols-1 gap-x-[10px] gap-y-[20px] w-full md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto_auto]"
    : "grid grid-cols-1 gap-x-[10px] gap-y-[20px] w-full md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto]";
  const insightCardClass = editMode
    ? "border p-[20px] w-full rounded-[8px] space-y-[20px] hover:bg-green-500/5 hover:border hover:border-green-500 lg:row-span-4 lg:grid lg:[grid-template-rows:subgrid] lg:space-y-0"
    : "border p-[20px] w-full rounded-[8px] space-y-[20px] hover:bg-green-500/5 hover:border hover:border-green-500 lg:row-span-3 lg:grid lg:[grid-template-rows:subgrid] lg:space-y-0";

  return (
    <div ref={targetRef}>
      <div className="mt-[20px] mb-[80px]">
        {editMode && (
          <div className="mb-[20px] flex flex-wrap items-center justify-between gap-3 rounded-[8px] border p-[20px]">
            <div className="min-w-0">
              <p className="!text-[12px] font-[400] tracking-[.1rem] text-foreground font-SansFlex uppercase">
                Linked song
              </p>
              <p className="mt-1 font-SansFlex text-[14px] text-muted-foreground">
                {linkedIsrc
                  ? `ISRC ${linkedIsrc}`
                  : "Match this campaign to a recording to pull playlist placements."}
              </p>
              {linkedIsrc && insightStats && (
                <p className="mt-1 font-SansFlex text-[12px] text-muted-foreground">
                  Airplay, social media, actions, streaming and performance
                  update automatically.
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-[8px] border-zinc-300 !bg-white px-5 text-sm font-medium !text-zinc-950 shadow-none hover:!bg-zinc-100 hover:!text-zinc-950 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-violet-500/25 dark:border-zinc-700 dark:!bg-zinc-900 dark:!text-zinc-100 dark:hover:!bg-zinc-800 dark:hover:!text-zinc-100"
              onClick={() => setLinkSongModal(true)}
            >
              {linkedIsrc ? "Change song" : "Link song"}
            </Button>
          </div>
        )}

        <div className={insightGridClass}>
          <div className={insightCardClass}>
            {editMode && (
              <div className="space-y-3">
                {hasIsrc ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={editActionButtonClassName}
                    onClick={() => openSources("airplay")}
                  >
                    <Settings2 className="size-4" />
                    Data controls
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className={editActionButtonClassName}
                      onClick={() => {
                        setInitialTab("moments");
                        setAddMediaModal(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Add media
                    </Button>
                  </>
                )}
              </div>
            )}

            <div className="  border-b pb-[20px]">
              <DoughnutChart
                title="AIRPLAY"
                value={airPlayData?.total_count ?? 0}
                chartData={chartDataForDoughnutAirplay}
                isLoading={isInsightStatsLoading}
                info="Estimated total number of airplay instances this campaign received across radio, television, and DJ/club activations."
                emptyMessage={
                  airplayDisabled
                    ? "Airplay is off — no countries selected. Radio spins and stations stay hidden until at least one country is picked."
                    : undefined
                }
                emptyAction={
                  airplayDisabled ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-full px-4 text-[13px] font-medium"
                      onClick={() =>
                        editMode
                          ? openSources("airplay")
                          : onRequestEditModeChange?.(true)
                      }
                    >
                      Choose countries
                    </Button>
                  ) : undefined
                }
              />
            </div>

            <div className="border-b pb-[20px]">
              <PieChart
                title="AUDIENCE"
                value={audienceData?.total_count ?? 0}
                chartData={pieChartDataAudience}
                info="Estimated total number of listeners and viewers reached on radio and television. This data is based on the audience size of the channels where your music was featured."
              />
            </div>

            <TopRadioCard
              stations={stations}
              loading={isRadioLoading}
              songTitle={songTitle}
              downloadButtonText="Download Data"
              hasMore={hasMoreRadio}
              isLoadingMore={isLoadingMoreRadio}
              onLoadMore={loadMoreRadio}
              onLinkSong={openLinkSong}
              airplayDisabled={airplayDisabled}
              onChooseMarkets={() =>
                editMode
                  ? openSources("airplay")
                  : onRequestEditModeChange?.(true)
              }
            />
          </div>
          <div className={insightCardClass}>
            {editMode && (
              <div className="space-y-3">
                {hasIsrc ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={editActionButtonClassName}
                    onClick={() => openSources("social")}
                  >
                    <Settings2 className="size-4" />
                    Data controls
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className={editActionButtonClassName}
                      onClick={() => {
                        setInitialTab("Recap");
                        setAddMediaModal(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Add media
                    </Button>
                  </>
                )}
              </div>
            )}

            <div className="  border-b pb-[20px] ">
              <PieChart
                title="SOCIAL MEDIA"
                value={socialMediaData?.total_count ?? 0}
                chartData={chartDataForPie}
                isLoading={isInsightStatsLoading}
                info="Views, likes, comments and shares on videos using this song, added up per platform."
              />
            </div>

            <div className="border-b pb-[20px]">
              <DoughnutChart
                title="ACTIONS"
                value={smactionData?.total_count ?? 0}
                chartData={chartDataForDoughnutSMAction}
                isLoading={isInsightStatsLoading}
                info="Current views, likes, comments and shares on videos using this song across TikTok, Instagram and YouTube."
              />
            </div>

            <TopCreatorsCard
              creators={topCreators}
              loading={isTopCreatorsLoading}
              isLinked={Boolean(songIsrc)}
              summaries={[
                { title: "Social Media", data: socialMediaData },
                { title: "Actions", data: smactionData },
              ]}
              onLinkSong={() => {
                if (editMode) {
                  setLinkSongModal(true);
                  return;
                }

                onRequestEditModeChange?.(true);
              }}
            />
          </div>
          <div className={insightCardClass}>
            {editMode && (
              <div className="space-y-3">
                {hasIsrc ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={editActionButtonClassName}
                    onClick={() => openSources("streaming")}
                  >
                    <Settings2 className="size-4" />
                    Data controls
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className={editActionButtonClassName}
                      onClick={() => {
                        setInitialTab("Dsp");
                        setAddMediaModal(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Add media
                    </Button>
                  </>
                )}
              </div>
            )}

            <div className="  border-b pb-[20px] ">
              <ColumnChart
                title="DISCOVERY AND STREAMING"
                value={discoveryAndStreamingTotal}
                chartData={chartDataForBar}
                isLoading={isInsightStatsLoading}
                info="Streams and views gained during this campaign, shown by DSP, with Shazam recognitions included as a separate discovery signal."
              />
            </div>

            <div className="border-b pb-[20px]">
              <PieChart
                title="PERFORMANCE "
                value={dspPerformanceData?.total_count ?? 0}
                chartData={pieChartDataDSPPerformance}
                isLoading={isInsightStatsLoading}
                info="Playlist reach split by how each placement was curated: editorial playlists programmed by the platform, user-created playlists, and algorithmic or radio placements. These figures are estimates;"
              />
            </div>

            <PlaylistsCard
              playlists={playlists}
              loading={isPlaylistsLoading}
              songTitle={songTitle}
              downloadButtonText="Download Data"
              failedPlatforms={failedPlatforms}
              onRetry={retryPlaylists}
              hasMore={hasMorePlaylists}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMorePlaylists}
              onLinkSong={openLinkSong}
            />
          </div>
        </div>
      </div>
      <AddMedia
        visible={addMediaModal}
        onHide={() => setAddMediaModal(false)}
        onSuccess={refreshContent}
        initialTab={initialTab}
      />

      <InsightSourcesDialog
        open={sourcesModal}
        scope={sourcesScope}
        sources={sources}
        markets={pickerMarkets}
        streamingPlatforms={insightStats?.availableStreamingPlatforms}
        selectedMarkets={activeMarkets}
        spinsByCountry={insightStats?.availableAirplayCountries}
        onOpenChange={setSourcesModal}
        onApplySources={saveSources}
        onApplyMarkets={setMarkets}
      />

      <LinkSongDialog
        open={linkSongModal}
        songTitle={songTitle}
        artistName={content?.artist_name}
        onOpenChange={setLinkSongModal}
        onLink={linkSong}
      />

      <BottomDock
        contentId={content?.id}
        handleDownloadData={handleDownloadData}
        notifications={content?.notifications}
        media={content?.media}
        reportMetrics={reportMetrics}
        reportLoading={reportLoading}
      />
    </div>
  );
};

export default CampaignInsights;
