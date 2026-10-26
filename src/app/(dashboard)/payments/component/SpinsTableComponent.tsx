"use client";
import React, { useState, useEffect } from "react";
import {
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  Grip,
  Info,
  XCircle,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { getSpinsAnalytics } from "@/services";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ChartData {
  position: number;
  song: string;
  artist: string;
  spins: number;
  lastWeek: number | null;
  peak: number;
  weeks: number;
  growth: number;
  status: "NEW" | "HOT" | "BREAKING" | "";
  location: string;
  dj: string;
}

interface SortConfig {
  column: keyof ChartData | null;
  direction: "asc" | "desc";
}

type VideoLanguage = "english" | "pidgin";

const parseDateParam = (value: string | null): Date | undefined => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
};

const SpinsTableComponent: React.FC = () => {
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<DateRange>();
  const [datesReady, setDatesReady] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: "asc",
  });
  const [tableData, setTableData] = useState<ChartData[]>([]);
  const [videoLang, setVideoLang] = useState<VideoLanguage>("english");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const startFromUrl = parseDateParam(params.get("start_date"));
    const endFromUrl = parseDateParam(params.get("end_date"));

    if (startFromUrl && endFromUrl && startFromUrl <= endFromUrl) {
      setDateRange({ from: startFromUrl, to: endFromUrl });
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      setDateRange({ from: start, to: end });
    }

    setDatesReady(true);
  }, []);

  const formatDateRange = (range?: DateRange): string => {
    if (!range?.from || !range.to) return "Select date range";

    const fmt = (d: Date): string =>
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    return `${fmt(range.from)} - ${fmt(range.to)}`;
  };

  const startDate = dateRange?.from;
  const endDate = dateRange?.to;
  const formattedDateRange = formatDateRange(dateRange);

  // Function to map API data to ChartData format
  const mapApiDataToChartData = (apiData: any[]): ChartData[] => {
    return apiData.map((item, index) => {
      // Parse song and artist from title
      const titleParts = item.title.split(" by ");
      const song = titleParts[0] || item.title;
      const artist = titleParts[1] || item.artist || "";

      return {
        position: index + 1,
        song: song.trim(),
        artist: artist.trim(),
        spins: item.spin_count || 0,
        lastWeek: item.lw || 0,
        peak: 0,
        weeks: item.woc || 0,
        growth: item.growth_percentage,
        status: item.status || "",
        location: item.top_locations?.[0]?.location || "",
        dj: item.top_djs?.[0]?.dj_name || "",
      };
    });
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!datesReady || !startDate || !endDate) return;

    const startDateStr = startDate ? formatDateForAPI(startDate) : undefined;
    const endDateStr = endDate ? formatDateForAPI(endDate) : undefined;

    getSpinsAnalytics(startDateStr, endDateStr)
      .then((fetchedContent: any) => {
        console.log("ANALYTICS", fetchedContent?.audio_spins);
        if (
          fetchedContent?.audio_spins &&
          Array.isArray(fetchedContent.audio_spins)
        ) {
          const mappedData = mapApiDataToChartData(fetchedContent.audio_spins);
          setTableData(mappedData);
        }
      })
      .catch((err) => {
        console.error("Error fetching analytics data:", err);
      });
  }, [datesReady, startDate, endDate]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);

    if (!range?.from || !range.to) return;

    const params = new URLSearchParams(window.location.search);
    params.set("start_date", formatDateForAPI(range.from));
    params.set("end_date", formatDateForAPI(range.to));

    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
    setCalendarOpen(false);
  };
  // Initial sample data
  const initialData: ChartData[] = [
    {
      position: 1,
      song: "MOVE (EDIT)",
      artist: "DJ ZED",
      spins: 1112,
      lastWeek: null,
      peak: 1,
      weeks: 1,
      growth: 10,
      status: "NEW",
      location: "LAGOS",
      dj: "DJ SPINALL",
    },
    {
      position: 2,
      song: "ENERGY",
      artist: "AMAARA",
      spins: 1615,
      lastWeek: null,
      peak: 2,
      weeks: 1,
      growth: 10,
      status: "NEW",
      location: "LONDON",
      dj: "DJ EZ",
    },
    {
      position: 3,
      song: "MIDNIGHT GROOVE",
      artist: "KAYBEE",
      spins: 5201,
      lastWeek: null,
      peak: 3,
      weeks: 1,
      growth: 10,
      status: "HOT",
      location: "ACCRA",
      dj: "DJ JULS",
    },
    {
      position: 4,
      song: "RHYTHM CTRL",
      artist: "ZINO FLEX",
      spins: 2900,
      lastWeek: null,
      peak: 4,
      weeks: 1,
      growth: 10,
      status: "NEW",
      location: "IBIZA",
      dj: "BLACK COFFEE",
    },
    {
      position: 5,
      song: "NO SIGNAL",
      artist: "AYO BLU",
      spins: 4100,
      lastWeek: null,
      peak: 5,
      weeks: 1,
      growth: 10,
      status: "HOT",
      location: "LAGOS",
      dj: "DJ CONSEQUENCE",
    },
    {
      position: 6,
      song: "ALL NIGHT LONG",
      artist: "MAYA SOUL",
      spins: 5400,
      lastWeek: null,
      peak: 6,
      weeks: 1,
      growth: 10,
      status: "HOT",
      location: "JOHANNESBURG",
      dj: "DJ MAPORISA",
    },
    {
      position: 7,
      song: "STEADY MOTION",
      artist: "TREVOR J",
      spins: 1800,
      lastWeek: null,
      peak: 7,
      weeks: 1,
      growth: 10,
      status: "NEW",
      location: "BERLIN",
      dj: "DJ TEN WALLS",
    },
    {
      position: 8,
      song: "LAST CALL",
      artist: "NOVA GREY",
      spins: 740,
      lastWeek: null,
      peak: 8,
      weeks: 1,
      growth: 10,
      status: "NEW",
      location: "PARIS",
      dj: "DJ DEEP",
    },
  ];

  useEffect(() => {
    // Only set initial data as fallback if no data has been loaded yet
    if (tableData.length === 0) {
      setTableData(initialData);
    }

    const handleScroll = (): void => {
      setShowBackToTop(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSort = (column: keyof ChartData): void => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.column === column && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...tableData].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    setTableData(sorted);
    setSortConfig({ column, direction });
  };

  const getMovementPill = (growth: number): React.ReactElement => {
    if (!growth) {
      return (
        <span className="bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-xs font-black">
          •
        </span>
      );
    }

    const delta = growth;

    if (delta > 0) {
      return (
        <span className="px-3 py-1.5 rounded-full text-xs font-black bg-green-100 text-green-600">
          ▲{delta}%
        </span>
      );
    } else if (delta < 0) {
      return (
        <span className="px-3 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-600">
          ▼{Math.abs(delta)}%
        </span>
      );
    }

    return (
      <span className="bg-muted text-muted-foreground rounded-full px-3 py-1.5 text-xs font-black">
        —
      </span>
    );
  };

  const getStatusPill = (status: string): React.ReactElement => {
    const styles: Record<string, string> = {
      NEW: "bg-sky-500 text-white",
      HOT: "bg-orange-500 text-white",
      BREAKING: "bg-foreground text-background",
      "": "bg-muted text-muted-foreground",
    };

    return (
      <span
        className={`px-3 py-1.5 rounded-full text-xs font-black ${styles[status] || styles[""]}`}
      >
        {status || "—"}
      </span>
    );
  };

  const exportToCSV = (): void => {
    const headers = [
      "POSITION",
      "SONG",
      "ARTIST",
      "SPINS",
      "LW",
      "PEAK",
      "WOC",
      "GROWTH",
      "STATUS",
      "TOP LOCATION",
      "TOP DJ",
    ];
    const rows = tableData.map((row) => [
      row.position,
      row.song,
      row.artist,
      row.spins,
      row.lastWeek || "—",
      row.peak,
      row.weeks,
      row.growth,
      row.status,
      row.location,
      row.dj,
    ]);

    const csvContent = [
      [formattedDateRange],
      headers,
      ...rows,
      [
        "",
        "Generated by Arroweye® Pro Tools. Explore Afrobeats DJ spins worldwide on https://spins.arroweye.pro/",
      ],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ae-spins.csv";
    link.click();
    setExportModalOpen(false);
  };

  const exportToPDF = (): void => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Arroweye® Pro Tools - DJ Spins Analytics", 14, 20);

    // Add date range
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(formattedDateRange, 14, 28);

    // Prepare table data
    const headers = [
      [
        "POS",
        "SONG",
        "ARTIST",
        "SPINS",
        "LW",
        "PEAK",
        "WOC",
        "GROWTH",
        "STATUS",
        "LOCATION",
        "DJ",
      ],
    ];

    const rows = tableData.map((row) => [
      row.position,
      row.song,
      row.artist,
      row.spins,
      row.lastWeek || "—",
      row.peak,
      row.weeks,
      row.growth,
      row.status,
      row.location,
      row.dj,
    ]);

    // Generate table
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 35,
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [59, 130, 246],
        fontStyle: "bold",
        halign: "center",
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" }, // POS
        1: { cellWidth: 25 }, // SONG
        2: { cellWidth: 22 }, // ARTIST
        3: { cellWidth: 12, halign: "center" }, // SPINS
        4: { cellWidth: 8, halign: "center" }, // LW
        5: { cellWidth: 10, halign: "center" }, // PEAK
        6: { cellWidth: 8, halign: "center" }, // WOC
        7: { cellWidth: 13, halign: "center" }, // GROWTH
        8: { cellWidth: 13 }, // STATUS
        9: { cellWidth: 18 }, // LOCATION
        10: { cellWidth: 18 }, // DJ
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { top: 35, left: 14, right: 14 },
    });

    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.height;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(
        "Generated by Arroweye® Pro Tools. Explore Afrobeats DJ spins worldwide on https://spins.arroweye.pro/",
        14,
        pageHeight - 10,
        { maxWidth: 180 },
      );
    }

    doc.save("ae-spins.pdf");
    setExportModalOpen(false);
  };

  const scrollToTop = (): void => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  interface MenuItem {
    name: string;
    img: string;
    url: string;
  }

  const menuItems: MenuItem[] = [
    {
      name: "Studio",
      img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701294/qkpawzztfn7c6osevfmm_sripez.svg",
      url: "https://studio.arroweye.pro/",
    },
    {
      name: "Spots",
      img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701294/21_elj38n_jljfio.svg",
      url: "https://spots.arroweye.pro/",
    },
    {
      name: "Showtime",
      img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701304/sds_nzwm72_m4pzcw.svg",
      url: "https://studio.arroweye.pro/",
    },
    {
      name: "Drops",
      img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701297/qkpawzztfn7c6osevfmm_1_14_dnwz5r_cduoei.svg",
      url: "https://studio.arroweye.pro/",
    },
    {
      name: "Spots",
      img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701294/21_elj38n_jljfio.svg",
      url: "https://spots.arroweye.pro/",
    },
    {
      name: "AI Tools",
      img: "https://res.cloudinary.com/dyueswnzk/image/upload/v1758701302/sds_3_tsxk8m_ftgc0v.svg",
      url: "https://cocoa.house/tools",
    },
  ];

  const tableHeaders: { label: string; key: keyof ChartData }[] = [
    { label: "POSITION", key: "position" },
    { label: "SONG", key: "song" },
    { label: "SPINS", key: "spins" },
    { label: "LW", key: "lastWeek" },
    { label: "PEAK", key: "peak" },
    { label: "WOC", key: "weeks" },
    { label: "GROWTH(%)", key: "growth" },
    { label: "STATUS", key: "status" },
    { label: "TOP LOCATION", key: "location" },
    { label: "TOP DJ", key: "dj" },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex justify-center items-center p-4">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-64 justify-start rounded-2xl px-4 text-left text-sm font-normal"
            >
              <CalendarDays className="text-muted-foreground mr-2 size-4" />
              <span className="truncate">{formattedDateRange}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            sideOffset={8}
            className="w-auto max-w-[calc(100vw-2rem)] overflow-auto p-0"
          >
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeSelect}
              defaultMonth={dateRange?.from}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Table */}
      <div className="p-5">
        <div className="overflow-x-auto">
          <Table
            className="min-w-[1100px] table-auto"
            aria-label="DJ spins chart"
          >
            <TableHeader>
              <TableRow className="rounded-2xl border-0 bg-[#31bc86] text-[16px] text-white hover:bg-[#31bc86]">
                {tableHeaders.map((header) => (
                  <TableHead
                    key={header.label}
                    className="h-auto px-4 py-[11px] text-center font-medium text-white"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(header.key)}
                      className="mx-auto inline-flex items-center gap-1.5 rounded-sm text-[16px] font-medium outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.98]"
                    >
                      {header.label}
                      {sortConfig.column === header.key ? (
                        <ArrowUp
                          aria-hidden="true"
                          className={`size-3.5 transition-transform duration-150 ${
                            sortConfig.direction === "desc" ? "rotate-180" : ""
                          }`}
                        />
                      ) : (
                        <ArrowUpDown
                          aria-hidden="true"
                          className="size-3.5 text-white/75"
                        />
                      )}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row: ChartData, idx: number) => (
                <TableRow
                  key={`${row.song}-${row.artist}-${idx}`}
                  className="border-0 text-[16px] font-normal text-grey-900 hover:bg-transparent dark:text-foreground"
                >
                  <TableCell className="border-none bg-[#31bc86] px-4 py-1 text-center text-[16px] text-white">
                    {row.position}
                  </TableCell>
                  <TableCell className="border border-grey-100 bg-[#f5f5f5] px-4 py-1 text-left text-[#212529] dark:border-border dark:bg-card dark:text-foreground">
                    <div className="font-medium">{row.song.toUpperCase()}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {row.artist.toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell className="border border-grey-100 bg-[#f5f5f5] px-4 py-1 text-center font-medium text-[#212529] dark:border-border dark:bg-card dark:text-foreground">
                    {row.spins}
                  </TableCell>
                  <TableCell className="border border-grey-100 bg-[#f5f5f5] px-4 py-1 text-center text-[#212529] dark:border-border dark:bg-card dark:text-foreground">
                    {row.lastWeek || "—"}
                  </TableCell>
                  <TableCell className="border border-grey-100 bg-[#f5f5f5] px-4 py-1 text-center text-[#212529] dark:border-border dark:bg-card dark:text-foreground">
                    {row.peak || "—"}
                  </TableCell>
                  <TableCell className="border border-grey-100 bg-[#f5f5f5] px-4 py-1 text-center text-[#212529] dark:border-border dark:bg-card dark:text-foreground">
                    {row.weeks || "—"}
                  </TableCell>
                  <TableCell className="border border-grey-100 bg-[#f5f5f5] px-4 py-1 text-center text-[#212529] dark:border-border dark:bg-card dark:text-foreground">
                    {getMovementPill(row.growth)}
                  </TableCell>
                  <TableCell className="border border-grey-100 bg-[#f5f5f5] px-4 py-1 text-center text-[#212529] dark:border-border dark:bg-card dark:text-foreground">
                    {getStatusPill(row.status)}
                  </TableCell>
                  <TableCell className="border border-grey-100 bg-[#f5f5f5] px-4 py-1 text-center text-[#212529] dark:border-border dark:bg-card dark:text-foreground">
                    {row.location.toUpperCase() || "—"}
                  </TableCell>
                  <TableCell className="border border-grey-100 bg-[#f5f5f5] px-4 py-1 text-center text-[#212529] dark:border-border dark:bg-card dark:text-foreground">
                    {row.dj.toUpperCase() || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={() => setExportModalOpen(true)}
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-blue-700 transition-colors"
      >
        Export
      </button>

      {/* Export Modal */}
      {exportModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setExportModalOpen(false)}
          />
          <div className="bg-background text-foreground fixed top-1/2 left-1/2 z-50 w-[min(550px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border p-8 shadow-xl">
            <button
              onClick={() => setExportModalOpen(false)}
              className="text-muted-foreground hover:text-foreground float-right"
            >
              <XCircle size={24} />
            </button>
            <p className="text-center text-lg mt-14 mb-8">
              Select your export format
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={exportToCSV}
                className="w-48 h-48 border rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors font-semibold"
              >
                CSV
              </button>
              <button
                onClick={exportToPDF}
                className="w-48 h-48 border rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors font-semibold"
              >
                PDF
              </button>
            </div>
          </div>
        </>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="icon-lg"
            aria-label="Open data guide"
            className="bg-foreground text-background hover:bg-foreground/80 fixed bottom-8 left-5 z-30 size-12 rounded-full shadow-lg active:scale-[0.97]"
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
                  The total number of verified plays a song receives from
                  tracked DJs during the selected chart period. Spins are
                  aggregated across{" "}
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
                  Charts reflect activity within a weekly reporting period
                  unless otherwise specified. Rankings are determined using a
                  combination of total spins, week-over-week movement, and
                  sustained chart presence, rather than spins alone. Interactive
                  sorting allows alternate views of the data but does not affect
                  official chart positions.
                </p>
                <strong>LW (Last Week)</strong>
                <p className="mt-2 mb-5 opacity-90">
                  Indicates the song's position on the previous chart. A dash
                  (—) means the track did not appear on the chart during the
                  prior period.
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
                  The DJ or broadcaster who played the song most frequently
                  within the selected period, based on tracked and verified data
                  sources.
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

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed right-8 bottom-8 flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg transition-colors hover:bg-foreground hover:text-background"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default SpinsTableComponent;
