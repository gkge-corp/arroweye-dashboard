import { NextRequest, NextResponse } from "next/server";

import { readCountryName } from "@/lib/music-analytics/country-names";
import {
  fetchTrackStats,
  readList,
  songstatsErrorResponse,
} from "@/lib/music-analytics/songstats-track-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Songstats caps expanded lists at 100 per source per call.
const VIDEOS_PER_SOURCE = 100;
const MAX_CREATORS = 25;

// YouTube videos come back without their channel, so only these two can be
// attributed to a creator.
const platforms = [
  { source: "tiktok", label: "TikTok" },
  { source: "instagram", label: "Instagram" },
] as const;

type Platform = (typeof platforms)[number];

type Video = Record<string, unknown>;

interface CreatorRow {
  id: string;
  handle: string;
  name: string;
  platform: string;
  country: string;
  followers: number;
  posts: number;
  views: number;
  likes: number;
  url: string;
}

const readText = (video: Video, field: string) => {
  const value = video[field];
  return typeof value === "string" ? value.trim() : "";
};

const readCount = (video: Video, field: string) => {
  const value = Number(video[field] ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

const profileUrl = (platform: Platform, handle: string) =>
  platform.source === "tiktok"
    ? `https://www.tiktok.com/@${handle}`
    : `https://www.instagram.com/${handle}/`;

/**
 * Posts arrive one per video and a creator can post the sound several times,
 * so posts are rolled up per creator and ranked by the views they drove.
 */
const collectCreators = (platform: Platform, videos: Video[]) => {
  const prefix = platform.source;
  const creators = new Map<string, CreatorRow>();

  for (const video of videos) {
    const handle = readText(video, `${prefix}_user_handle`);
    if (!handle) continue;

    const existing = creators.get(handle);
    const followers = readCount(video, `${prefix}_user_followers`);
    const views = readCount(video, "views_total");
    const likes = readCount(video, "likes_total");

    if (existing) {
      existing.posts += 1;
      existing.views += views;
      existing.likes += likes;
      existing.followers = Math.max(existing.followers, followers);
      continue;
    }

    creators.set(handle, {
      id: `${prefix}-${handle}`,
      handle,
      name: readText(video, `${prefix}_user_name`) || handle,
      platform: platform.label,
      country: readCountryName(readText(video, `${prefix}_user_country`)),
      followers,
      posts: 1,
      views,
      likes,
      url: profileUrl(platform, handle),
    });
  }

  return [...creators.values()];
};

export async function GET(request: NextRequest) {
  const isrc = request.nextUrl.searchParams.get("isrc")?.trim();

  if (!isrc) {
    return NextResponse.json(
      { error: "Provide the song's ISRC.", code: "MISSING_ISRC" },
      { status: 400 },
    );
  }

  try {
    const stats = await fetchTrackStats(
      isrc,
      platforms.map((platform) => platform.source),
      { with_videos: true, limit: VIDEOS_PER_SOURCE },
    );

    const items = platforms
      .flatMap((platform) =>
        collectCreators(
          platform,
          readList<Video>(stats.get(platform.source), "videos"),
        ),
      )
      .sort((a, b) => b.views - a.views || b.followers - a.followers)
      .slice(0, MAX_CREATORS);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Songstats top creators failed:", error);
    return songstatsErrorResponse(error);
  }
}
