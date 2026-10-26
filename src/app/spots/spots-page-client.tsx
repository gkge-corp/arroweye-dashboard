"use client";

import type { CSSProperties, ReactNode } from "react";
import { RotateCw } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useElementHeight } from "@/hooks/use-element-height";
import { cn } from "@/lib/utils";
import {
  engagementLabel,
  formatAudience,
  useSpots,
  type SpotsTab,
} from "./hooks/use-spots";

const TABS: { id: SpotsTab; label: string }[] = [
  { id: "radio", label: "Radio" },
  { id: "tv", label: "TV" },
  { id: "publications", label: "Publications" },
];

const cellClassName =
  "border-b border-border px-4 py-6 text-center text-[15px] uppercase";

function SpotsHeader({
  tab,
  onTabChange,
}: {
  tab: SpotsTab;
  onTabChange: (tab: SpotsTab) => void;
}) {
  return (
    <nav
      aria-label="Media type"
      className="flex items-center justify-center gap-6 py-8 sm:gap-9"
    >
      {TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={tab === item.id}
          onClick={() => onTabChange(item.id)}
          className={cn(
            "text-[17px] transition-colors",
            tab === item.id
              ? "font-semibold text-foreground"
              : "text-foreground/80 hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function SpotsTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto border border-border lg:overflow-x-clip">
      <table className="w-full min-w-[720px] table-auto">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="sticky top-[var(--spots-header-height,0px)] z-10 border-b border-border bg-[#f6f6f6] px-4 py-6 text-center text-xs font-semibold uppercase text-foreground dark:bg-zinc-900"
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
    <td
      className={cn(
        cellClassName,
        "font-semibold",
        value >= 1_000_000 ? "text-green-700" : "text-orange-500",
      )}
    >
      {formatAudience(value)}
    </td>
  );
}

function RadioRows({ spots }: { spots: ReturnType<typeof useSpots> }) {
  if (spots.isRadioLoading) {
    return Array.from({ length: 8 }, (_, index) => (
      <tr key={index}>
        <td colSpan={4} className="px-4 py-3">
          <Skeleton className="h-10 w-full" />
        </td>
      </tr>
    ));
  }

  if (spots.hasRadioError) {
    return (
      <tr>
        <td
          colSpan={4}
          className="px-4 py-10 text-center text-muted-foreground"
        >
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
      <td className={cellClassName}>{station.country}</td>
      <AudienceCell value={station.reach} />
    </tr>
  ));
}

export default function SpotsPageClient() {
  const spots = useSpots();
  const header = useElementHeight<HTMLDivElement>();

  return (
    <div
      className="min-h-screen bg-background pb-28 font-SansFlex text-foreground"
      style={{ "--spots-header-height": `${header.height}px` } as CSSProperties}
    >
      {/* Table headers stick just below this bar. */}
      <div ref={header.ref} className="sticky top-0 z-30 bg-background">
        <SpotsHeader tab={spots.tab} onTabChange={spots.setTab} />
      </div>

      <main className="px-3 sm:px-4">
        {spots.tab === "radio" && (
          <SpotsTable headers={["Position", "Channel", "Country", "Audience"]}>
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
            ]}
          >
            {spots.publications.map((publication, index) => (
              <tr key={publication.name}>
                <td className={cellClassName}>{index + 1}</td>
                <td className={cellClassName}>
                  <a
                    href={publication.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {publication.name}
                  </a>
                </td>
                <td className={cellClassName}>{publication.country}</td>
                <td className={cellClassName}>{publication.seoScore}</td>
                <AudienceCell value={publication.audience} />
                <td className={cellClassName}>
                  {engagementLabel(publication.engagement)}
                </td>
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
              </tr>
            ))}
          </SpotsTable>
        )}
      </main>

      <button
        type="button"
        onClick={spots.exportCsv}
        disabled={spots.tab === "radio" && spots.radioStations.length === 0}
        className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        Export
      </button>
    </div>
  );
}
