"use client";

import type { CSSProperties, ReactNode } from "react";
import { Play, RotateCw } from "lucide-react";

import {
  activeColumnClassName,
  SortableTableHeader,
  sortableCellClassName,
} from "@/components/sortable-table-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { useActiveColumn } from "@/hooks/use-active-column";
import { useElementHeight } from "@/hooks/use-element-height";
import { cn } from "@/lib/utils";
import {
  engagementLabel,
  formatAudience,
  useSpots,
  type SpotsSortColumn,
  type SpotsTab,
} from "./hooks/use-spots";

type SpotsState = ReturnType<typeof useSpots>;

type SpotsColumn = { label: string; key?: SpotsSortColumn };

// Columns without a key (Listen) are not sortable.
const RADIO_COLUMNS: SpotsColumn[] = [
  { label: "Position", key: "position" },
  { label: "Channel", key: "name" },
  { label: "Country", key: "country" },
  { label: "Audience", key: "audience" },
  { label: "Listen" },
];

const TV_COLUMNS: SpotsColumn[] = RADIO_COLUMNS.slice(0, 4);

const PUBLICATION_COLUMNS: SpotsColumn[] = [
  { label: "Position", key: "position" },
  { label: "Publication", key: "name" },
  { label: "Country", key: "country" },
  { label: "SEO score", key: "seoScore" },
  { label: "Audience", key: "audience" },
  { label: "Engagement", key: "engagement" },
  { label: "Top platform", key: "topPlatform" },
];

const TABS: { id: SpotsTab; label: string }[] = [
  { id: "radio", label: "Radio" },
  { id: "tv", label: "TV" },
  { id: "publications", label: "Publications" },
];

const cellClassName = cn(
  "border-b border-neutral-200 px-3 py-5 text-center text-sm text-neutral-800 uppercase dark:border-border dark:text-foreground",
  sortableCellClassName,
);

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
  spots,
  columns,
  children,
}: {
  spots: SpotsState;
  columns: SpotsColumn[];
  /** Renders the rows; `cell` gives the class for a column's body cells. */
  children: (cell: (key?: SpotsSortColumn) => string) => ReactNode;
}) {
  // The template highlights the name column until something is sorted.
  const { activeColumn, highlightProps } = useActiveColumn<SpotsSortColumn>(
    spots.sort.column ?? "name",
  );

  const cell = (key?: SpotsSortColumn) =>
    cn(
      cellClassName,
      key && activeColumn === key && activeColumnClassName("orange"),
    );

  return (
    <div className="overflow-x-auto lg:overflow-x-clip">
      {/* Plain table: the ui Table wrapper scrolls, which breaks the sticky header. */}
      <table className="w-full min-w-[720px] table-auto">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map(({ label, key }) => (
              <SortableTableHeader
                key={label}
                label={label}
                tone="orange"
                active={Boolean(key) && activeColumn === key}
                sortDirection={
                  key && spots.sort.column === key ? spots.sort.direction : null
                }
                onSort={key ? () => spots.toggleSort(key) : undefined}
                highlightProps={key ? highlightProps(key) : undefined}
                className="sticky top-[var(--spots-header-height,0px)]"
              />
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children(cell)}</TableBody>
      </table>
    </div>
  );
}

function ListenButton({ station }: { station: string }) {
  return (
    <a
      href={`https://radio.garden/search?q=${encodeURIComponent(station)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Listen to ${station}`}
      className="inline-flex size-9 items-center justify-center rounded-full bg-black text-white transition-transform duration-150 hover:scale-105 active:scale-95 dark:bg-white dark:text-black"
    >
      <Play className="size-3.5 translate-x-px fill-current" />
    </a>
  );
}

function AudienceCell({
  value,
  className,
}: {
  value: number;
  className: string;
}) {
  return (
    <td
      className={cn(
        className,
        "font-semibold",
        value >= 1_000_000
          ? "text-[#2fa93f] dark:text-green-400"
          : "text-orange-500",
      )}
    >
      {formatAudience(value)}
    </td>
  );
}

function RadioRows({
  spots,
  cell,
}: {
  spots: SpotsState;
  cell: (key?: SpotsSortColumn) => string;
}) {
  if (spots.isRadioLoading) {
    return Array.from({ length: 8 }, (_, index) => (
      <tr key={index}>
        <td colSpan={RADIO_COLUMNS.length} className="px-4 py-3">
          <Skeleton className="h-10 w-full" />
        </td>
      </tr>
    ));
  }

  if (spots.hasRadioError) {
    return (
      <tr>
        <td
          colSpan={RADIO_COLUMNS.length}
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
      <td className={cell("position")}>{station.position}</td>
      <td className={cell("name")}>{station.name}</td>
      <td className={cell("country")}>{station.country}</td>
      <AudienceCell value={station.audience} className={cell("audience")} />
      <td className={cell()}>
        <ListenButton station={station.name} />
      </td>
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
          <SpotsTable spots={spots} columns={RADIO_COLUMNS}>
            {(cell) => <RadioRows spots={spots} cell={cell} />}
          </SpotsTable>
        )}

        {spots.tab === "tv" && (
          <SpotsTable spots={spots} columns={TV_COLUMNS}>
            {(cell) =>
              spots.tvChannels.map((channel) => (
                <tr key={channel.name}>
                  <td className={cell("position")}>{channel.position}</td>
                  <td className={cell("name")}>{channel.name}</td>
                  <td className={cell("country")}>{channel.country}</td>
                  <AudienceCell
                    value={channel.audience}
                    className={cell("audience")}
                  />
                </tr>
              ))
            }
          </SpotsTable>
        )}

        {spots.tab === "publications" && (
          <SpotsTable spots={spots} columns={PUBLICATION_COLUMNS}>
            {(cell) =>
              spots.publications.map((publication) => (
                <tr key={publication.name}>
                  <td className={cell("position")}>{publication.position}</td>
                  <td className={cell("name")}>
                    <a
                      href={publication.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {publication.name}
                    </a>
                  </td>
                  <td className={cell("country")}>{publication.country}</td>
                  <td className={cell("seoScore")}>{publication.seoScore}</td>
                  <AudienceCell
                    value={publication.audience}
                    className={cell("audience")}
                  />
                  <td className={cell("engagement")}>
                    {engagementLabel(publication.engagement)}
                  </td>
                  <td className={cell("topPlatform")}>
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
              ))
            }
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
