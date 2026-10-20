"use client";

import type { ReactNode } from "react";

import { ArtistAudienceCard } from "./artist-audience-card";
import { ArtistProfileHeader } from "./artist-profile-header";
import { ArtistStatsGrid } from "./artist-stats-grid";
import { ArtistTopTracksCard } from "./artist-top-tracks-card";
import { FollowerGrowthCard } from "./follower-growth-card";
import {
  BottomDock,
  type BottomDockProps,
} from "../campaign-insights/bottom-dock";
import { useArtistAnalytics } from "./hooks/use-artist-analytics";
import { useArtistReportSend } from "./hooks/use-artist-report-send";

interface ArtistAnalyticsProps {
  campaignId: string;
  campaignTitle?: string;
  artistName?: string;
  isrc?: string;
  members?: ReactNode;
  dockProps: Omit<BottomDockProps, "onSendReport" | "reportMetrics">;
}

const cardClassName =
  "rounded-[8px] border p-[20px] hover:bg-green-500/5 hover:border-green-500";

export default function ArtistAnalytics({
  campaignId,
  campaignTitle,
  artistName,
  isrc,
  members,
  dockProps,
}: ArtistAnalyticsProps) {
  const analytics = useArtistAnalytics(campaignId, {
    isrc,
    artist: artistName,
  });
  const sendReport = useArtistReportSend(campaignId, analytics.followerRange);

  return (
    <div>
      <ArtistProfileHeader
        campaignId={campaignId}
        campaignTitle={campaignTitle}
        fallbackName={artistName}
        artist={analytics.profile?.artist}
        loading={analytics.isProfileLoading}
      >
        {members}
      </ArtistProfileHeader>

      <div className="mt-[60px] space-y-[20px]">
        {analytics.profileError ? (
          <div className="flex h-[160px] items-center justify-center rounded-[8px] border border-dashed px-4 text-center font-SansFlex text-[14px] text-muted-foreground">
            {analytics.profileError}
          </div>
        ) : (
          <>
            <ArtistStatsGrid
              platforms={analytics.profile?.platforms ?? []}
              growth={analytics.followerGrowth}
              growthDays={analytics.followerRange}
              growthLoading={analytics.isFollowerHistoryLoading}
              loading={analytics.isProfileLoading}
            />

            <FollowerGrowthCard
              platforms={analytics.followerPlatforms}
              points={analytics.followerPoints}
              range={analytics.followerRange}
              onRangeChange={analytics.setFollowerRange}
              summary={analytics.artistSummary}
              summaryLoading={analytics.isArtistSummaryLoading}
              loading={analytics.isFollowerHistoryLoading}
              hasError={analytics.hasFollowerHistoryError}
            />

            <div className="grid grid-cols-1 gap-[20px] lg:grid-cols-3">
              <div className={cardClassName}>
                <ArtistTopTracksCard
                  tracks={analytics.topTracks}
                  loading={analytics.isTopTracksLoading}
                />
              </div>
              <div className={`${cardClassName} lg:col-span-2`}>
                <ArtistAudienceCard
                  cities={analytics.listenerCities}
                  countries={analytics.listenerCountries}
                  loading={analytics.isAudienceLoading}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <BottomDock
        {...dockProps}
        onSendReport={analytics.profileError ? undefined : sendReport}
      />
    </div>
  );
}
