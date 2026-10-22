import "server-only";

import { resolveArtist } from "../songstats-artist";
import { deriveArtistSignals } from "./artist-signals";
import { summarizeFollowerGrowth, type FollowerRange } from "./follower-growth";
import { generateArtistRecommendations } from "./generate-artist-recommendations";
import { loadArtistAudience } from "./load-artist-audience";
import { loadArtistProfile } from "./load-artist-profile";
import { loadArtistTopTracks } from "./load-artist-top-tracks";
import { readCampaignArtist, summarizeArtist } from "./load-artist-summary";
import { loadFollowerHistory } from "./load-follower-history";

type UnknownRecord = Record<string, unknown>;

// Lists, the summary and recommendations are extras: a failure there leaves the section out
// of the report rather than failing the send.
const optional = async <T>(label: string, task: Promise<T>, fallback: T) => {
  try {
    return await task;
  } catch (error) {
    console.error(`Artist report ${label} failed:`, error);
    return fallback;
  }
};

/** Every figure the artist report shows, built on the server. */
export const loadArtistReport = async (
  project: UnknownRecord,
  days: FollowerRange,
) => {
  const { isrc, artistName } = readCampaignArtist(project);
  if (!isrc) return null;

  const artist = await resolveArtist(isrc, artistName || undefined);
  if (!artist) return null;

  const [profile, history, topTracks, audience] = await Promise.all([
    loadArtistProfile(artist.artistId),
    loadFollowerHistory(artist.artistId, days),
    optional(
      "top tracks",
      loadArtistTopTracks(artist.artistId, artist.trackId),
      [],
    ),
    optional("audience", loadArtistAudience(artist.artistId), {
      cities: [],
      countries: [],
    }),
  ]);
  const growth = summarizeFollowerGrowth(history);
  const [summary, recommendations] = await Promise.all([
    optional(
      "summary",
      summarizeArtist({ artistId: artist.artistId, artistName, history }),
      null,
    ),
    optional(
      "recommendations",
      generateArtistRecommendations({
        artist: profile.artist.name || artistName,
        signals: deriveArtistSignals(growth),
        topTracks: topTracks.slice(0, 5).map((track) => track.title),
        topCountries: audience.countries
          .slice(0, 5)
          .map((country) => country.country),
      }),
      [],
    ),
  ]);

  return {
    days,
    profile,
    growth,
    topTracks,
    audience,
    summary,
    recommendations,
  };
};

export type ArtistReport = NonNullable<
  Awaited<ReturnType<typeof loadArtistReport>>
>;
