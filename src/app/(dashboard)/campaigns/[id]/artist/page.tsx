"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import ArtistAnalytics from "@/components/campaigns/artist-analytics";
import NoNetwork from "@/components/no-network";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaignDetail } from "@/hooks/use-campaign-detail";
import { useCampaignExports } from "@/hooks/use-campaign-exports";
import { hasAccess } from "@/lib/utils";
import { CampaignMembersSection } from "../_components/campaign-members-section";

const readIsrc = (content: any) =>
  String(content?.isrc || content?.song_isrc || "")
    .trim()
    .toUpperCase() || undefined;

function ArtistPageNotice({
  campaignId,
  message,
}: {
  campaignId: string;
  message: string;
}) {
  return (
    <div className="mx-auto flex h-[240px] w-full max-w-7xl flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed px-4 text-center font-SansFlex">
      <p className="text-[14px] text-muted-foreground">{message}</p>
      <Link
        href={`/campaigns/${campaignId}`}
        className="text-[14px] font-[500] text-foreground underline underline-offset-4 hover:text-orange-500"
      >
        Back to campaign
      </Link>
    </div>
  );
}

const ArtistAnalyticsPage = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const {
    content,
    subvendorStaff,
    staffSuggestions,
    userLoggedInProfile,
    isContentFetching,
    hasNetworkError,
    refreshContent,
  } = useCampaignDetail(id);
  const { handleExportCSV } = useCampaignExports(content);

  const artistName = content?.artist_name || content?.campaign?.song_artist;
  const campaignTitle =
    content?.title || content?.song_title || content?.campaign?.song_title;
  const isrc = readIsrc(content);

  React.useEffect(() => {
    if (artistName) document.title = `${artistName} - Arroweye`;
  }, [artistName]);

  if (hasNetworkError) return <NoNetwork onReconnect={refreshContent} />;

  if (!content && isContentFetching) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-[72px] w-[420px] max-w-full" />
        <Skeleton className="h-[280px] w-full rounded-[8px]" />
      </div>
    );
  }

  if (!hasAccess(userLoggedInProfile, ["Manager", "Supervisor"])) {
    return (
      <ArtistPageNotice
        campaignId={id}
        message="You don't have access to artist analytics for this campaign."
      />
    );
  }

  if (!isrc) {
    return (
      <ArtistPageNotice
        campaignId={id}
        message="Link a song to this campaign to see its artist's analytics."
      />
    );
  }

  return (
    <div className="relative mx-auto mb-[80px] w-full max-w-7xl">
      <ArtistAnalytics
        campaignId={id}
        campaignTitle={campaignTitle}
        artistName={artistName}
        isrc={isrc}
        members={
          <CampaignMembersSection
            id={id}
            content={content}
            refreshContent={refreshContent}
            members={subvendorStaff}
            staffSuggestions={staffSuggestions}
            userLoggedInProfile={userLoggedInProfile}
          />
        }
        dockProps={{
          contentId: content?.id,
          handleDownloadData: handleExportCSV,
          notifications: content?.notifications,
          media: content?.media,
        }}
      />
    </div>
  );
};

export default ArtistAnalyticsPage;
