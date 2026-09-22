import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface InsightMetric {
  id: number;
  name: string;
}

interface InsightDataPoint {
  metric: number;
  week_1?: number | null;
  week_2?: number | null;
  week_3?: number | null;
  week_4?: number | null;
}

interface InsightGroup {
  platform?: { name?: string; metrics?: InsightMetric[] } | null;
  data?: InsightDataPoint[] | null;
}

interface InsightRow {
  source: string;
  platform: string;
  metric: string;
  week: number;
  value: number;
}

const WEEK_KEYS = ["week_1", "week_2", "week_3", "week_4"] as const;

// DSP, airplay and social all share one shape: a platform carrying its own
// metrics list, plus rows keyed by metric id with a value per week. Flatten
// each into one row per metric per week so nothing stays nested.
const toInsightRows = (
  source: string,
  groups: InsightGroup[] | undefined,
): InsightRow[] =>
  (groups ?? []).flatMap((group) => {
    const platform = group.platform?.name ?? "";
    const metricNames = new Map(
      (group.platform?.metrics ?? []).map((metric) => [metric.id, metric.name]),
    );

    return (group.data ?? []).flatMap((point) =>
      WEEK_KEYS.flatMap((key, index) => {
        const value = point[key];

        if (value === undefined || value === null) return [];

        return [
          {
            source,
            platform,
            metric: metricNames.get(point.metric) ?? String(point.metric),
            week: index + 1,
            value,
          },
        ];
      }),
    );
  });

const escapeCsv = (value: string | number) => {
  const text = String(value ?? "");

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function useCampaignExports(content: any) {
  const handleDownloadPDF = () => {
    const downloadToast = toast.loading("Downloading PDF...");
    const input = document.getElementById("pdf-content");

    if (!input) return;

    document.body.style.overflow = "hidden";
    const fullHeight = input.scrollHeight;

    html2canvas(input, {
      scale: 2,
      height: fullHeight,
      windowHeight: fullHeight,
      scrollY: -window.scrollY,
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("landscape");
        const pageWidth = 297;
        const pageHeight = 210;
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        let position = 0;
        while (position < imgHeight) {
          if (position > 0) {
            pdf.addPage();
          }

          pdf.addImage(imgData, "PNG", 0, -position, imgWidth, imgHeight);
          position += pageHeight;
        }

        pdf.save("dashboard.pdf");
        toast.success("PDF Downloaded", {
          id: downloadToast,
          duration: 3000,
        });
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
        toast.error("Failed to download PDF", {
          id: downloadToast,
          duration: 3000,
        });
      })
      .finally(() => {
        document.body.style.overflow = "";
      });
  };

  const handleExportCSV = () => {
    if (!content || Object.keys(content).length === 0) {
      toast.error("No data available to export");
      return;
    }

    const rows = [
      ...toInsightRows(
        "DSP",
        content.project_dsp?.map((group: any) => ({
          platform: group.dsp,
          data: group.dsp_data,
        })),
      ),
      ...toInsightRows(
        "Airplay",
        content.project_airplay?.map((group: any) => ({
          platform: group.airplay,
          data: group.airplay_data,
        })),
      ),
      ...toInsightRows(
        "Social",
        content.project_sm?.map((group: any) => ({
          platform: group.sm,
          data: group.sm_data,
        })),
      ),
    ];

    if (rows.length === 0) {
      toast.error("No insight data available to export");
      return;
    }

    const headers = ["Source", "Platform", "Metric", "Week", "Value"];
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        [row.source, row.platform, row.metric, row.week, row.value]
          .map(escapeCsv)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${content.code ?? "campaign"}-insights.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${rows.length} rows`);
  };

  return {
    handleDownloadPDF,
    handleExportCSV,
  };
}
