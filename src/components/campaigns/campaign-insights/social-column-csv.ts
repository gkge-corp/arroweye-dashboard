import { buildCsv, buildCsvSections, type CsvSection } from "@/lib/csv";

import { creatorCsvColumns, type CreatorRow } from "./top-creators-card";

/** A chart's label -> value map, as the insight charts hold it. */
export interface ColumnSummary {
  title: string;
  data?: Record<string, number>;
}

const summarySection = ({ title, data = {} }: ColumnSummary) => {
  const entries = Object.entries(data).filter(([key]) => key !== "total_count");
  if (entries.length === 0) return null;

  const rows: [string, number][] = [
    ...entries,
    ["Total", Number(data.total_count ?? 0)],
  ];
  return {
    title,
    csv: buildCsv<[string, number]>(
      [
        { header: "Label", value: ([label]) => label },
        { header: "Value", value: ([, value]) => value },
      ],
      rows,
    ),
  };
};

/**
 * Everything the social column shows (the charts above the card and top
 * creators) as sections of one CSV. Empty parts are
 * left out; null means there is nothing to export at all.
 */
export const buildSocialColumnCsv = ({
  summaries,
  creators,
}: {
  summaries: ColumnSummary[];
  creators: CreatorRow[];
}) => {
  const sections: CsvSection[] = [
    ...summaries.map(summarySection),
    creators.length > 0
      ? { title: "Top Creators", csv: buildCsv(creatorCsvColumns, creators) }
      : null,
  ].filter((section): section is CsvSection => section !== null);

  return sections.length > 0 ? buildCsvSections(sections) : null;
};
