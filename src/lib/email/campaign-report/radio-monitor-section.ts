import type { CampaignReportRadioStation } from "@/types/campaign-report";

import {
  escapeHtml,
  formatNumber,
  infoNote,
  safeUrl,
  sectionTitle,
} from "./utils";

// Gold, silver, bronze for the top three; plain grey after that.
const RANK_BADGES = [
  { background: "#f6d365", border: "#e5b83d" },
  { background: "#eeeeee", border: "#d8d8d8" },
  { background: "#dda06f", border: "#c98956" },
];
const DEFAULT_BADGE = { background: "#f7f7f7", border: "#e5e5e5" };

const headerCell = (label: string, style: string) =>
  `<td ${style}font-size:9px;font-weight:bold;color:#999;text-transform:uppercase;">${label}</td>`;

const renderStationRow = (
  station: CampaignReportRadioStation,
  index: number,
  showCountry: boolean,
) => {
  const badge = RANK_BADGES[index] ?? DEFAULT_BADGE;
  const cell = "padding:11px 8px 11px 0;border-top:1px solid #e9e9e9;";
  const numberCell = "padding:11px 0 11px 8px;border-top:1px solid #e9e9e9;";
  const country = showCountry
    ? `<td style="${numberCell}text-align:right;font-size:13px;font-weight:bold;color:#777;white-space:normal;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(station.country)}</td>`
    : "";

  return `<tr><td style="${cell}vertical-align:middle;"><div style="width:28px;height:28px;line-height:28px;text-align:center;background:${badge.background};border:1px solid ${badge.border};border-radius:50%;font-size:11px;font-weight:bold;color:#222;box-sizing:border-box;">${index + 1}</div></td><td style="${cell}font-size:13px;font-weight:bold;color:#222;">${escapeHtml(station.name)}</td><td style="${numberCell}text-align:right;font-size:13px;font-weight:bold;color:#222;">${formatNumber(station.plays)}</td>${country}</tr>`;
};

const renderStationsTable = (stations: CampaignReportRadioStation[]) => {
  const showCountry = stations.some(({ country }) => country.trim());
  const header = [
    headerCell("#", 'width="32" style="padding:0 8px 10px 0;'),
    headerCell("Station", 'style="padding:0 8px 10px 0;'),
    headerCell(
      "Plays",
      'width="65" style="padding:0 0 10px 8px;text-align:right;',
    ),
    showCountry
      ? headerCell(
          "Country",
          'width="115" style="padding:0 0 10px 8px;text-align:right;white-space:normal;',
        )
      : "",
  ].join("");
  const rows = stations
    .map((station, index) => renderStationRow(station, index, showCountry))
    .join("");
  const countryNote = showCountry
    ? `<div style="font-size:12px;color:#777;margin-top:10px;">&#9432; Country identifies the country where each monitored radio station is based, helping show the geographic market associated with the station.</div>`
    : "";

  return `<div style="margin-top:14px;background:#fff;border:1px solid #e7e7e7;border-radius:8px;padding:16px;"><div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;font-weight:bold;color:#777;margin-bottom:10px;">Top Radio Stations</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;table-layout:fixed;"><tr>${header}</tr>${rows}</table>${countryNote}</div>`;
};

// The download link is only passed in when the song is on an uploaded radio monitor chart.
export const renderRadioMonitor = (
  stations: CampaignReportRadioStation[],
  downloadLink?: string,
) => {
  const link = safeUrl(downloadLink);
  if (stations.length === 0 && !link) return "";

  const download = link
    ? `<div style="margin-top:12px;text-align:right;"><a href="${link}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:13px;font-weight:bold;padding:9px 15px;border-radius:999px;">Download</a></div>${infoNote("This download link expires in 30 days.")}`
    : "";

  return `<div style="margin-top:28px;border-top:1px solid #e5e5e5;padding-top:22px;">${sectionTitle("Radio Monitor")}<div style="font-size:13px;color:#666;margin-top:4px;">Weekly radio performance covering plays and rankings across monitored stations.</div>${stations.length ? renderStationsTable(stations) : ""}${download}</div>`;
};

export const describeRadioStations = (stations: CampaignReportRadioStation[]) =>
  stations
    .map(
      ({ name, plays, country }, index) =>
        `${index + 1}. ${name}${country ? ` (${country})` : ""}: ${formatNumber(plays)} plays`,
    )
    .join("\n");
