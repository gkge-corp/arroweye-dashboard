import { ExternalLink } from "lucide-react";

import { PLATFORM_ICONS } from "@/components/campaigns/artist-analytics/platform-brand";
import type { ArtistPageData } from "@/types/api";

export function ProfileSidebar({ artist }: { artist: ArtistPageData }) {
  const profile = artist.profile;
  const imageUrl = profile?.avatar ?? artist.image_url;
  const country = profile?.country || artist.countries.join(" · ");

  return (
    <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- provider avatars come from many hosts
        <img src={imageUrl} alt={artist.name} className="aspect-square w-full max-w-60 rounded-sm object-cover" />
      )}

      <div>
        {country && (
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">{country}</p>
        )}
        <p className="mt-1 text-2xl font-semibold text-white">{artist.name}</p>
      </div>

      {profile && profile.links.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {profile.links.map((link) => {
            const Icon = PLATFORM_ICONS[link.code] ?? ExternalLink;
            return (
              <li key={link.code}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-[#31bc86] hover:text-[#31bc86]"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {profile?.markets.primary && (
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-neutral-400">Primary Market</dt>
            <dd className="mt-1 text-white">{profile.markets.primary}</dd>
          </div>
          {profile.markets.secondary && (
            <div>
              <dt className="text-neutral-400">Secondary Market</dt>
              <dd className="mt-1 text-white">{profile.markets.secondary}</dd>
            </div>
          )}
        </dl>
      )}
    </aside>
  );
}
