"use client";

import type { ReactNode } from "react";
import { ExternalLink, RotateCw } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatAudience, useSpots, type SpotsTab } from "./hooks/use-spots";

const TABS: { id: SpotsTab; label: string }[] = [
  { id: "radio", label: "Radio" },
  { id: "tv", label: "TV" },
  { id: "publications", label: "Publications" },
];

const cellClassName =
  "border-b border-border px-4 py-4 text-center text-[15px] uppercase";

function SpotsTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[8px] border border-border lg:overflow-x-clip">
      <table className="w-full min-w-[720px] table-auto">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="sticky top-0 z-10 bg-[#31bc86] px-4 py-[11px] text-center text-[14px] font-medium text-white dark:bg-[#17954c]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function AudienceCell({ value }: { value: number }) {
  return (
    <td className={cn(cellClassName, "font-semibold text-green-600")}>
      {formatAudience(value)}
    </td>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-full bg-zinc-950 text-white transition-transform active:scale-[0.96] dark:bg-zinc-100 dark:text-zinc-950"
    >
      <ExternalLink className="size-4" />
    </a>
  );
}

function RadioRows({
  spots,
}: {
  spots: ReturnType<typeof useSpots>;
}) {
  if (spots.isRadioLoading) {
    return Array.from({ length: 8 }, (_, index) => (
      <tr key={index}>
        <td colSpan={5} className="px-4 py-3">
          <Skeleton className="h-8 w-full" />
        </td>
      </tr>
    ));
  }

  if (spots.hasRadioError) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
          <span>Radio stations could not be loaded.</span>
          <button
            type="button"
            onClick={spots.retryRadio}
            className="ml-2 inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
          >
            <RotateCw className="size-3.5" />
            Retry
          </button>
        </td>
      </tr>
    );
  }

  return spots.radioStations.map((station) => (
    <tr key={station.id}>
      <td className={cellClassName}>{station.position}</td>
      <td className={cellClassName}>{station.name}</td>
      <td className={cellClassName}>{station.city || "—"}</td>
      <td className={cellClassName}>{station.country}</td>
      <AudienceCell value={station.reach} />
    </tr>
  ));
}

export default function SpotsPageClient() {
  const spots = useSpots();

  return (
    <div className="min-h-screen bg-background pb-28 font-SansFlex text-foreground">
      <nav
        aria-label="Media type"
        className="flex items-center justify-center gap-8 py-8"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={spots.tab === tab.id}
            onClick={() => spots.setTab(tab.id)}
            className={cn(
              "text-[17px] transition-colors",
              spots.tab === tab.id
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="px-5">
        {spots.tab === "radio" && (
          <SpotsTable
            headers={["Position", "Channel", "City", "Country", "Reach"]}
          >
            <RadioRows spots={spots} />
          </SpotsTable>
        )}

        {spots.tab === "tv" && (
          <SpotsTable headers={["Position", "Channel", "Country", "Audience"]}>
            {spots.tvChannels.map((channel, index) => (
              <tr key={channel.name}>
                <td className={cellClassName}>{index + 1}</td>
                <td className={cellClassName}>{channel.name}</td>
                <td className={cellClassName}>{channel.country}</td>
                <AudienceCell value={channel.audience} />
              </tr>
            ))}
          </SpotsTable>
        )}

        {spots.tab === "publications" && (
          <SpotsTable
            headers={[
              "Position",
              "Publication",
              "Country",
              "SEO score",
              "Audience",
              "Engagement",
              "Top platform",
              "Visit",
            ]}
          >
            {spots.publications.map((publication, index) => (
              <tr key={publication.name}>
                <td className={cellClassName}>{index + 1}</td>
                <td className={cellClassName}>{publication.name}</td>
                <td className={cellClassName}>{publication.country}</td>
                <td className={cellClassName}>{publication.seoScore}</td>
                <AudienceCell value={publication.audience} />
                <td className={cellClassName}>{publication.engagement}/10</td>
                <td className={cellClassName}>
                  <a
                    href={publication.social}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {publication.topPlatform}
                  </a>
                </td>
                <td className={cellClassName}>
                  <LinkButton
                    href={publication.website}
                    label={`Visit ${publication.name}`}
                  />
                </td>
              </tr>
            ))}
          </SpotsTable>
        )}
      </div>

      <button
        type="button"
        onClick={spots.exportCsv}
        disabled={spots.tab === "radio" && spots.radioStations.length === 0}
        className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        Export CSV
      </button>
    </div>
  );
}
