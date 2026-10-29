"use client";
import React, { useState, type CSSProperties } from "react";
import { CalendarDays, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useElementHeight } from "@/hooks/use-element-height";
import {
  useSpinsChart,
  type ChartData,
  type SortColumn,
  type SpinStatus,
} from "@/hooks/use-spins-chart";
import { cn } from "@/lib/utils";

type VideoLanguage = "english" | "pidgin";

type SpinsChart = ReturnType<typeof useSpinsChart>;

const tableHeaders: { label: string; key: SortColumn }[] = [
  { label: "POSITION", key: "position" },
  { label: "SONG", key: "song" },
  { label: "SPINS", key: "spins" },
  { label: "LW", key: "lastWeek" },
  { label: "PEAK", key: "peak" },
  { label: "WOC", key: "weeks" },
  { label: "GROWTH", key: "movement" },
  { label: "STATUS", key: "status" },
  { label: "GENRE", key: "genre" },
  { label: "TOP LOCATION", key: "location" },
  { label: "TOP DJ", key: "dj" },
];

const cellClassName =
  "border-b border-neutral-200 px-3 py-5 text-center text-sm whitespace-normal text-neutral-800 uppercase dark:border-border dark:text-foreground";

// Column being sorted (or hovered): outlined and tinted from header to last row.
const activeColumnClassName =
  "border-x border-x-neutral-600 bg-[#dd6236]/[0.08] dark:border-x-neutral-500 dark:bg-[#dd6236]/[0.12]";

const pillClassName = "rounded-full px-3 py-1.5 text-xs font-black";

const movementPillClassName =
  "inline-flex h-7 w-16 items-center justify-center rounded-full text-xs font-semibold";

const statusPillStyles: Record<SpinStatus, string> = {
  NEW: "bg-sky-500 text-white",
  HOT: "bg-orange-500 text-white",
  BREAKING: "bg-foreground text-background",
  "": "bg-muted text-muted-foreground",
};

function MovementPill({ movement }: { movement: number | null }) {
  if (movement === null) {
    return (
      <span
        className={cn(
          movementPillClassName,
          "bg-[#ececee] text-neutral-500 dark:bg-white/10 dark:text-neutral-300",
        )}
      >
        •
      </span>
    );
  }

  if (movement > 0) {
    return (
      <span
        className={cn(
          movementPillClassName,
          "bg-[#e7f4e8] text-[#3f9f4f] dark:bg-green-500/15 dark:text-green-400",
        )}
      >
        ▲{movement}
      </span>
    );
  }

  if (movement < 0) {
    return (
      <span
        className={cn(
          movementPillClassName,
          "bg-[#fbe9e7] text-[#d0453a] dark:bg-red-500/15 dark:text-red-400",
        )}
      >
        ▼{Math.abs(movement)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        movementPillClassName,
        "bg-[#ececee] text-neutral-500 dark:bg-white/10 dark:text-neutral-300",
      )}
    >
      –
    </span>
  );
}

function StatusPill({ status }: { status: SpinStatus }) {
  return (
    <span className={cn(pillClassName, statusPillStyles[status])}>
      {status || "—"}
    </span>
  );
}

function SpinsHeader({ chart }: { chart: SpinsChart }) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-8 sm:px-8">
      <span />

      <Popover open={chart.calendarOpen} onOpenChange={chart.setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-64 justify-start rounded-2xl px-4 text-left text-sm font-normal"
          >
            <CalendarDays className="text-muted-foreground mr-2 size-4" />
            <span className="truncate">{chart.formattedDateRange}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          sideOffset={8}
          className="w-auto max-w-[calc(100vw-2rem)] overflow-auto p-0"
        >
          <Calendar
            mode="range"
            selected={chart.dateRange}
            onSelect={chart.handleDateRangeSelect}
            defaultMonth={chart.dateRange?.from}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>

      <DataGuideDialog />
    </header>
  );
}

function SongCell({ row, className }: { row: ChartData; className: string }) {
  const linkProps = row.songUrl
    ? { href: row.songUrl, target: "_blank", rel: "noopener noreferrer" }
    : null;

  return (
    <TableCell className={className}>
      {linkProps ? (
        <a
          {...linkProps}
          className="font-semibold underline-offset-4 hover:underline"
        >
          {row.song}
        </a>
      ) : (
        <span className="font-semibold">{row.song}</span>
      )}
      <div className="mt-0.5 text-xs text-muted-foreground">{row.artist}</div>
    </TableCell>
  );
}

function SpinsTable({ chart }: { chart: SpinsChart }) {
  const [hoveredColumn, setHoveredColumn] = useState<SortColumn | null>(null);

  const activeColumn = hoveredColumn ?? chart.sortConfig.column;

  const columnClassName = (key: SortColumn) =>
    cn(cellClassName, activeColumn === key && activeColumnClassName);

  return (
    <div className="overflow-x-auto lg:overflow-x-clip">
      {/* Plain table: the ui Table wrapper scrolls, which breaks the sticky header. */}
      <table
        className="w-full min-w-[1100px] table-auto text-xs lg:min-w-0"
        aria-label="DJ spins chart"
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {tableHeaders.map((header) => (
              <TableHead
                key={header.key}
                aria-sort={
                  chart.sortConfig.column === header.key
                    ? chart.sortConfig.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
                className="sticky top-[var(--spins-header-height,0px)] z-10 h-auto bg-background p-0"
              >
                {/* Band above the grey header row that holds the "Sorting by" tab. */}
                <div className="flex h-8 items-end">
                  {activeColumn === header.key && (
                    <span className="flex h-full w-full items-center justify-center rounded-t-lg bg-[#dd6236] text-[10px] font-semibold tracking-wide text-white">
                      SORTING BY
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => chart.handleSort(header.key)}
                  onMouseEnter={() => setHoveredColumn(header.key)}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onFocus={() => setHoveredColumn(header.key)}
                  onBlur={() => setHoveredColumn(null)}
                  className={cn(
                    "flex h-14 w-full min-w-20 items-center justify-center border-y border-neutral-200 bg-[#f6f6f6] px-2 text-center text-xs font-bold text-black uppercase outline-none dark:border-border dark:bg-zinc-900 dark:text-foreground",
                    activeColumn === header.key &&
                      "border-x border-x-neutral-600 bg-[#f6e8e3] text-[#dd6236] dark:border-x-neutral-500 dark:bg-[#2a1d18] dark:text-[#dd6236]",
                  )}
                >
                  {header.label}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {chart.tableData.map((row, idx) => (
            <TableRow
              key={`${row.song}-${row.artist}-${idx}`}
              className="border-0 hover:bg-transparent"
            >
              <TableCell className={columnClassName("position")}>
                {row.position}
              </TableCell>
              <SongCell row={row} className={columnClassName("song")} />
              <TableCell
                className={cn(
                  columnClassName("spins"),
                  "font-bold text-black dark:text-foreground",
                )}
                style={{
                  backgroundColor: `rgba(230, 90, 40, ${
                    0.08 + chart.spinsIntensity(row.spins) * 0.22
                  })`,
                }}
              >
                {row.spins}
              </TableCell>
              <TableCell className={columnClassName("lastWeek")}>
                {row.lastWeek || "—"}
              </TableCell>
              <TableCell className={columnClassName("peak")}>
                {row.peak || "—"}
              </TableCell>
              <TableCell className={columnClassName("weeks")}>
                {row.weeks || "—"}
              </TableCell>
              <TableCell className={columnClassName("movement")}>
                <MovementPill movement={row.movement} />
              </TableCell>
              <TableCell className={columnClassName("status")}>
                <StatusPill status={row.status} />
              </TableCell>
              <TableCell className={columnClassName("genre")}>
                {row.genre || "—"}
              </TableCell>
              <TableCell className={columnClassName("location")}>
                {row.location || "—"}
              </TableCell>
              <TableCell className={columnClassName("dj")}>
                {row.dj || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
    </div>
  );
}

function ExportDialog({ chart }: { chart: SpinsChart }) {
  const [open, setOpen] = useState(false);

  const exportAs = (exportFile: () => void) => {
    exportFile();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
        >
          Export
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="mt-8 text-center text-lg font-normal">
            Select your preferred format
          </DialogTitle>
          <DialogDescription className="sr-only">
            Download the spins chart as a CSV or PDF file.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => exportAs(chart.exportToCSV)}
            className="size-40 rounded-lg border font-semibold transition-colors hover:border-blue-500 hover:text-blue-500 sm:size-48"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => exportAs(chart.exportToPDF)}
            className="size-40 rounded-lg border font-semibold transition-colors hover:border-blue-500 hover:text-blue-500 sm:size-48"
          >
            PDF
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DataGuideDialog() {
  const [videoLang, setVideoLang] = useState<VideoLanguage>("english");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon-lg"
          aria-label="Open data guide"
          className="bg-foreground text-background hover:bg-foreground/80 size-11 justify-self-end rounded-full active:scale-[0.97]"
        >
          <Info className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(82vh,760px)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle className="text-xl font-bold">Data Guide</DialogTitle>
          <DialogDescription>
            Understand how spins, rankings, growth, and chart indicators are
            calculated.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto px-6 pb-6">
          <div className="mt-6 space-y-4 leading-relaxed">
            <div>
              <strong>Spins</strong>
              <p className="mt-2 opacity-90">
                The total number of verified plays a song receives from tracked
                DJs during the selected chart period. Spins are aggregated
                across{" "}
                <a
                  target="new"
                  className="underline"
                  href="https://arroweye.pro/product/spins"
                >
                  Arroweye® Pro Spins
                </a>{" "}
                and all monitored sources, forming the primary basis for chart
                rankings.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setVideoLang("english")}
                className={`rounded-xl px-4 py-2 font-bold ${videoLang === "english" ? "bg-foreground text-background" : "bg-background border"}`}
              >
                English
              </button>
              <button
                onClick={() => setVideoLang("pidgin")}
                className={`rounded-xl px-4 py-2 font-bold ${videoLang === "pidgin" ? "bg-foreground text-background" : "bg-background border"}`}
              >
                Pidgin
              </button>
            </div>

            <div className="border rounded-2xl overflow-hidden mt-4 flex justify-center">
              <div
                className={
                  videoLang === "english"
                    ? "aspect-video w-full"
                    : "aspect-[9/16] max-h-[576px]"
                }
              >
                <iframe
                  src={
                    videoLang === "english"
                      ? "https://www.youtube.com/embed/bfeT5Yo2890"
                      : "https://www.youtube.com/embed/rg1C6qYKHyE"
                  }
                  title={
                    videoLang === "english"
                      ? "Arroweye Pro® Spins"
                      : "Arroweye Pro® Spins (Pidgin)"
                  }
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>

            <div>
              <strong>Ranking</strong>
              <p className="mt-2 mb-5 opacity-90">
                Charts reflect activity within a weekly reporting period unless
                otherwise specified. Rankings are determined using a combination
                of total spins, week-over-week movement, and sustained chart
                presence, rather than spins alone. Interactive sorting allows
                alternate views of the data but does not affect official chart
                positions.
              </p>
              <strong>LW (Last Week)</strong>
              <p className="mt-2 mb-5 opacity-90">
                Indicates the song's position on the previous chart. A dash (—)
                means the track did not appear on the chart during the prior
                period.
              </p>
              <strong>WOC (Weeks on Chart)</strong>
              <p className="mt-2 mb-5 opacity-90">
                The total number of weeks a song has appeared on the chart,
                including the current week. This metric reflects longevity and
                sustained audience or DJ support.
              </p>
              <strong>Growth</strong>
              <p className="mt-2 opacity-90">
                Shows the change in chart position compared to the previous
                period.
              </p>
              <div className="mt-3 p-3 border rounded-xl flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-black bg-green-100 text-green-600">
                    ▲7
                  </span>
                  <span className="opacity-85">Up</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-xs font-black">
                    —
                  </span>
                  <span className="opacity-85">No change</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-600">
                    ▼3
                  </span>
                  <span className="opacity-85">Down</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-xs font-black">
                    •
                  </span>
                  <span className="opacity-85">New entry</span>
                </div>
              </div>
            </div>

            <div>
              <strong>Status</strong>
              <p className="mt-2 opacity-90">
                Editorial indicators that highlight notable chart activity.
              </p>
              <div className="mt-3 p-3 border rounded-xl flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-black bg-sky-500 text-white">
                    NEW
                  </span>
                  <span className="opacity-85">First appearance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-foreground text-background rounded-full px-3 py-1.5 text-xs font-black">
                    BREAKING
                  </span>
                  <span className="opacity-85">Big jump / Top 5 entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-black bg-orange-500 text-white">
                    HOT
                  </span>
                  <span className="opacity-85">High spins / momentum</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-black">
                    -
                  </span>
                  <span className="opacity-85">Stable</span>
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-3">
              <strong>Example Scenarios</strong>
              <div className="mt-4 flex gap-2">
                <div className="bg-muted text-muted-foreground flex w-14 justify-center rounded-full px-3 py-1.5 text-xs font-black">
                  •
                </div>
                <span className="px-3 py-1.5 rounded-full text-xs font-black bg-sky-500 text-white">
                  NEW
                </span>
                <p>Debut entry on the chart</p>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="w-14 flex justify-center px-3 py-1.5 rounded-full text-xs font-black bg-green-100 text-green-600">
                  ▲6
                </div>{" "}
                <span className="bg-foreground text-background rounded-full px-3 py-1.5 text-xs font-black">
                  BREAKING
                </span>
                <p>Fast riser / major jump</p>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="w-14 flex justify-center px-3 py-1.5 rounded-full text-xs font-black bg-green-100 text-green-600">
                  ▲2
                </div>
                <span className="px-3 py-1.5 rounded-full text-xs font-black bg-orange-500 text-white">
                  HOT
                </span>
                <p>Strong momentum & spins</p>
              </div>
              <div className="mt-3 flex gap-2">
                <div className="w-14 flex justify-center px-3 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-600">
                  ▼4
                </div>{" "}
                <span className="px-3 py-1.5 rounded-full text-xs font-black">
                  -
                </span>
                <p>Decline without breakout activity</p>
              </div>
            </div>
            <div>
              {" "}
              <strong>Top Location</strong>
              <p className="mt-2 mb-4 opacity-90">
                The city or market where the song recorded its highest
                concentration of verified spins during the chart period.
              </p>
              <strong>Top DJ</strong>
              <p className="mt-2 opacity-90">
                The DJ or broadcaster who played the song most frequently within
                the selected period, based on tracked and verified data sources.
              </p>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <p className="font-bold text-lg">Need Assistance?</p>
            <p className="mt-4 opacity-90 leading-relaxed">
              Drop us a message at{" "}
              <a href="mailto:hi@arroweye.pro" className="underline">
                hi@arroweye.pro
              </a>
              . We are always working to make this tool better for you.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const SpinsTableComponent: React.FC = () => {
  const chart = useSpinsChart();
  const header = useElementHeight<HTMLDivElement>();

  return (
    <div
      className="min-h-screen bg-background pb-28 text-foreground"
      style={{ "--spins-header-height": `${header.height}px` } as CSSProperties}
    >
      {/* Table headers stick just below this bar. */}
      <div ref={header.ref} className="sticky top-0 z-30 bg-background">
        <SpinsHeader chart={chart} />
      </div>

      <main className="px-3 sm:px-4">
        <SpinsTable chart={chart} />
      </main>

      <ExportDialog chart={chart} />
    </div>
  );
};

export default SpinsTableComponent;
