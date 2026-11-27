"use client";

import Link from "next/link";

import { ArtistBio } from "./_components/artist-bio";
import { DETAILS_ID, ProfileHero } from "./_components/profile-hero";
import { Collaborations, LatestRelease, TopTracks } from "./_components/profile-sections";
import { ProfileSidebar } from "./_components/profile-sidebar";
import { StatCard } from "./_components/stat-card";
import { useArtistPage } from "./hooks/use-artist-page";

// One colour per stat card, as in the profile design.
const STAT_COLORS = ["#f26a2e", "#e9518f", "#a259e6", "#e8c03a"];

function PageMessage({ children }: { children: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="text-sm text-neutral-400">{children}</p>
      <Link href="/canvas" className="text-sm font-medium text-[#31bc86] hover:underline">
        Back to all artists
      </Link>
    </div>
  );
}

export default function ArtistPageClient({ slug }: { slug: string }) {
  const { artist, profile, isLoading, isNotFound, isError } = useArtistPage(slug);

  return (
    <div className="min-h-screen bg-neutral-900">
      <ProfileHero
        name={artist?.name}
        imageUrl={profile?.avatar ?? artist?.image_url}
        verified={artist?.verified}
        genres={profile?.genres}
        isLoading={isLoading}
      />

      <main id={DETAILS_ID} className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isNotFound ? (
          <PageMessage>We couldn&apos;t find this artist.</PageMessage>
        ) : isError ? (
          <PageMessage>We couldn&apos;t load this artist. Please try again shortly.</PageMessage>
        ) : isLoading || !artist ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {STAT_COLORS.map((color) => (
              <div key={color} className="h-48 animate-pulse rounded-lg bg-neutral-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
            <ProfileSidebar artist={artist} />

            <div className="min-w-0 space-y-6">
              {profile?.bio && <ArtistBio bio={profile.bio} />}

              {profile && profile.stats.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {profile.stats.map((stat, index) => (
                    <StatCard key={stat.code} stat={stat} color={STAT_COLORS[index % STAT_COLORS.length]} />
                  ))}
                </div>
              )}

              {profile?.latestRelease && <LatestRelease release={profile.latestRelease} />}
              {profile && profile.collaborators.length > 0 && <Collaborations names={profile.collaborators} />}
              {profile && profile.topTracks.length > 0 && <TopTracks tracks={profile.topTracks} />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
