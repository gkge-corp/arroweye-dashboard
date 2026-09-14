"use client";
import React from "react";
import AddData from "../AddData";
import AddMedia from "../AddMedia";
import AddDataSocials from "../AddDataSocials";
import AddDataDsp from "../AddDataDsp";
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
import { useCampaignPlaylists } from "./hooks/use-campaign-playlists";
import { useCampaignRadio } from "./hooks/use-campaign-radio";
import { useCampaignSocialTraction } from "./hooks/use-campaign-social-traction";
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
import { SocialTractionCard } from "./social-traction-card";

const selectOptions = [
  [
    { value: "nigeria", label: "Nigeria" },
    { value: "UK", label: "UK" },
    { value: "ghana", label: "Ghana" },
    { value: "kenya", label: "Kenya" },
    { value: "ivoryCoast", label: "Ivory Coast" },
  ],
];
const selectOptionsAirPlay = [
  [
    { value: "", label: "Countries" },
    { value: "Nigeria", label: "Nigeria" },
    { value: "UK", label: "UK" },
    { value: "Kenya", label: "Kenya" },
    { value: "SouthAfrica", label: "S.Africa" },
    { value: "IvoryCoast", label: "Ivory Coast" },
    { value: "Ghana", label: "Ghana" },
  ],
];
const selectOptionsAudience = [
  [
    { value: "", label: "Channels" },
    { value: "Radio", label: "Radio" },
    { value: "DJ", label: "DJ" },
    { value: "TV", label: "Local TV" },
    { value: "Cable", label: "Cable" },
  ],
];

const countryFlags = [
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇬🇧", name: "United Kingdom" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇮🇳", name: "India" },
  { flag: "🇯🇵", name: "Japan" },
  { flag: "🇮🇹", name: "Italy" },
  { flag: "🇨🇳", name: "China" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇩🇪", name: "Germany" },
];

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
  const { linkedSong, linkSong } = useCampaignSong(content?.id);
  const hasIsrc = [content?.song_isrc, content?.isrc, linkedSong?.isrc].some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
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

  const { insightStats } = useCampaignInsightStats(linkedSong?.uuid, {
    // Switching every market off skips the airplay call, but that call is the
    // only source of the country list. With nothing remembered yet the picker
    // would have nothing to offer, so it is fetched once to fill the cache and
    // skipped on every load after that.
    radio: !airplayDisabled || knownMarkets.length === 0,
    social: true,
    reachPlatforms: sources.reachPlatforms,
    artistPlatforms: sources.artistSocialPlatforms,
    countries: selectedMarkets,
    ready: sourcesLoaded && marketsLoaded,
  });

  // Soundcharts reports audience for platforms with no playlist endpoint
  // (Anghami, JioSaavn), so the STREAMING chart can show more than the
  // playlist picker used to list. Hiding is applied here rather than in the
  // route so toggling a platform costs no further Soundcharts calls.
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
      ([label]) => label !== "total_count" && visibleStreamingLabels.has(label),
    );
    return {
      ...Object.fromEntries(kept),
      total_count: kept.reduce((sum, [, value]) => sum + Number(value), 0),
    };
  }, [insightStats?.dsp, visibleStreamingLabels]);
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
  // leave an empty list and no way to switch any back on.
  const pickerMarkets =
    availableMarkets.length > 0 ? availableMarkets : knownMarkets;

  const {
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
    setairplayChannelsFilters,
    setairplayAudienceFilters,
    setSocialMediaPlatformFilters,
    setSocialMediaActionsFilters,
    setDspFilters,
    setDspPerformanceFilters,
    chartDataForDoughnutAirplay,
    chartDataForDoughnutSMAction,
    chartDataForPie,
    pieChartDataAudience,
    pieChartDataDSPPerformance,
    chartDataForBar,
    isAirPlayDataLoading,
    isSocialMediaDataLoading,
    isDspDataLoading,
    isAudienceDataLoading,
    isSmActionDataLoading,
    isDspPerformanceDataLoading,
    onAddSocialMediaDataSuccess,
    onAddDataSuccess,
    onAddDataDspSuccess,
    targetRef,
  } = useCampaignInsights({
    content,
    refreshContent,
    statsOverrides: {
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
  } = useCampaignPlaylists(linkedSong?.uuid, {
    platforms: sources.playlistPlatforms,
    ready: sourcesLoaded && marketsLoaded,
  });
  const {
    stations,
    isRadioLoading,
    isLoadingMoreRadio,
    hasMoreRadio,
    loadMoreRadio,
  } = useCampaignRadio(linkedSong?.uuid, {
    enabled: marketsLoaded && !airplayDisabled,
    countries: selectedMarkets,
  });
  const {
    socialTraction,
    socialTractionPeriodDays,
    isSocialTractionLoading,
    hasSocialTractionError,
    retrySocialTraction,
  } = useCampaignSocialTraction(linkedSong?.uuid);
  const songTitle =
    content?.title || content?.song_title || content?.campaign?.song_title;

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
                {linkedSong
                  ? [linkedSong.title, linkedSong.artist]
                      .filter(Boolean)
                      .join(" · ")
                  : "Match this campaign to a recording to pull playlist placements."}
              </p>
              {linkedSong && insightStats && (
                <p className="mt-1 font-SansFlex text-[12px] text-muted-foreground">
                  Airplay, social media, streaming and performance update
                  automatically. Audience and actions use entered data.
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-[8px] border-zinc-300 !bg-white px-5 text-sm font-medium !text-zinc-950 shadow-none hover:!bg-zinc-100 hover:!text-zinc-950 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-violet-500/25 dark:border-zinc-700 dark:!bg-zinc-900 dark:!text-zinc-100 dark:hover:!bg-zinc-800 dark:hover:!text-zinc-100"
              onClick={() => setLinkSongModal(true)}
            >
              {linkedSong ? "Change song" : "Link song"}
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
                      onClick={() => setAddDataModal(true)}
                    >
                      <Plus className="size-4" />
                      Add data
                    </Button>
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
                selectOptions={selectOptionsAirPlay}
                selectOptionsBottom={selectOptionsAudience}
                chartData={chartDataForDoughnutAirplay}
                isLoading={isAirPlayDataLoading}
                setFilters={setairplayChannelsFilters}
                placeholder="Country"
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
                selectOptions={selectOptionsAudience}
                chartData={pieChartDataAudience}
                isLoading={isAudienceDataLoading}
                setFilters={setairplayAudienceFilters}
                selectOptionsBottom={selectOptionsAudience}
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
              onLinkSong={() => onRequestEditModeChange?.(true)}
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
                      onClick={() => setAddDataModalSocial(true)}
                    >
                      <Plus className="size-4" />
                      Add data
                    </Button>
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
                isLoading={isSocialMediaDataLoading}
                setFilters={setSocialMediaPlatformFilters}
                selectOptionsBottom={selectOptionsAudience}
                info="Estimated total recorded actions and engagements across individual social media platforms."
              />
            </div>

            <div className="border-b pb-[20px]">
              <DoughnutChart
                title="ACTIONS"
                value={smactionData?.total_count ?? 0}
                chartData={chartDataForDoughnutSMAction}
                isLoading={isSmActionDataLoading}
                setFilters={setSocialMediaActionsFilters}
                selectOptionsBottom={selectOptionsAudience}
                info="Estimated breakdown of engagement and interactions recorded across social media platforms."
              />
            </div>

            <SocialTractionCard
              rows={socialTraction}
              periodDays={socialTractionPeriodDays}
              loading={isSocialTractionLoading}
              hasError={hasSocialTractionError}
              onRetry={retrySocialTraction}
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
                      onClick={() => setAddDspModal(true)}
                    >
                      <Plus className="size-4" />
                      Add data
                    </Button>
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
                value={dspData?.total_count ?? 0}
                chartData={chartDataForBar}
                isLoading={isDspDataLoading}
                setFilters={setDspFilters}
                selectOptionsBottom={selectOptions}
                info="Estimated total number of streams and views recorded during this campaign across DSPs. These figures are estimates; please confirm the actual numbers with your distributor."
              />
            </div>

            <div className="border-b pb-[20px]">
              <PieChart
                title="PERFORMANCE "
                value={dspPerformanceData?.total_count ?? 0}
                selectOptionsBottom={selectOptions}
                chartData={pieChartDataDSPPerformance}
                isLoading={isDspPerformanceDataLoading}
                setFilters={setDspPerformanceFilters}
                info="Playlist reach split by how each placement was curated: editorial playlists programmed by the platform, user-created playlists, and algorithmic or radio placements. These figures are estimates; please verify the actual data with your distributor."
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
              onLinkSong={() => onRequestEditModeChange?.(true)}
            />
          </div>
        </div>
      </div>
      <AddData
        visible={addDataModal}
        onHide={() => setAddDataModal(false)}
        onAddDataSuccess={onAddDataSuccess}
        existingAirPlayData={content?.project_airplay}
      />
      <AddDataSocials
        visible={addDataModalSocial}
        onHide={() => setAddDataModalSocial(false)}
        onAddDataSuccess={onAddSocialMediaDataSuccess}
        existingSocialMediaData={content?.project_sm}
      />
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

      <AddDataDsp
        visible={addDspModal}
        onHide={() => setAddDspModal(false)}
        onAddDataSuccess={onAddDataDspSuccess}
        existingDSPData={content?.project_dsp}
      />

      <BottomDock
        contentId={content?.id}
        handleDownloadData={handleDownloadData}
        notifications={content?.notifications}
        media={content?.media}
      />
    </div>
  );
};

export default CampaignInsights;
