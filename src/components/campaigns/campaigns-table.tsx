import React, { useMemo } from "react";
import {
  Table,
  type TableHeader,
  type TableRow,
} from "@/components/campaigns/table";
import { BsTrash } from "react-icons/bs";
import Link from "next/link";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { Dialog } from "primereact/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useCampaignFilters } from "@/hooks/use-campaign-filters";
import CampaignFilters from "@/components/campaigns/campaign-filters";
import { useActiveColumn } from "@/hooks/use-active-column";
import { sortRows, useTableSort, type TableSort } from "@/hooks/use-table-sort";
import type { CampaignPage, ProjectListItem } from "@/types/api";
import Pagination from "@/app/(dashboard)/drops/component/pagination";

interface ProjectsProps {
  filterVisible: boolean;
  searchValue: string;
}

type SortColumn = "title" | "label" | "artist" | "startDate";
type CampaignListItem = NonNullable<CampaignPage>["results"][number];

const PROJECT_COLUMNS: { label: string; key: SortColumn }[] = [
  { label: "Campaigns", key: "title" },
  { label: "Label", key: "label" },
  { label: "Artist", key: "artist" },
  { label: "Start Date", key: "startDate" },
];

const ADVERTISER_COLUMNS: { label: string; key: SortColumn }[] = [
  { label: "Campaigns", key: "title" },
  { label: "Artist", key: "artist" },
  { label: "Start Date", key: "startDate" },
];

const projectSortValue = (item: ProjectListItem, column: SortColumn) =>
  ({
    title: item.title,
    label: item.subvendor?.organization_name,
    artist: item.artist_name,
    startDate: item.created,
  })[column];

const campaignSortValue = (item: CampaignListItem, column: SortColumn) =>
  ({
    title: item.song_title,
    label: undefined,
    artist: item.song_artist,
    startDate: item.start_date,
  })[column];

const toSortableHeaders = (
  columns: { label: string; key: SortColumn }[],
  sort: TableSort<SortColumn>,
  toggleSort: (column: SortColumn) => void,
  highlightProps: ReturnType<
    typeof useActiveColumn<SortColumn>
  >["highlightProps"],
): TableHeader[] =>
  columns.map(({ label, key }) => ({
    content: label,
    align: "left",
    onSort: () => toggleSort(key),
    sortDirection: sort.column === key ? sort.direction : null,
    highlightProps: highlightProps(key),
  }));

const EDIT_HEADER: TableHeader = { content: "Manage", align: "center" };
const DELETE_HEADER: TableHeader = { content: "Action", align: "center" };

const TableEmptyState = ({ label }: { label: string }) => (
  <div className="flex h-[50vh] flex-col items-center justify-center text-center">
    <div className="my-8">
      <p className="text-[20px] font-semibold text-grey-400">{label}</p>
    </div>
  </div>
);

const createTableSkeletonRows = (headers: TableHeader[]): TableRow[] =>
  Array.from({ length: 5 }, (_, rowIndex) => ({
    id: `campaign-skeleton-${rowIndex}`,
    data: headers.map((header, columnIndex) => (
      <Skeleton
        key={`campaign-skeleton-${rowIndex}-${columnIndex}`}
        aria-hidden="true"
        className={
          header.align === "center"
            ? "mx-auto size-5 rounded-full bg-muted-foreground/20"
            : columnIndex === 0
              ? "h-5 w-36 max-w-full bg-white/35"
              : "h-5 w-24 max-w-full bg-muted-foreground/20"
        }
      />
    )),
  }));

const Campaigns: React.FC<ProjectsProps> = ({ filterVisible, searchValue }) => {
  const campaignFilters = useCampaignFilters();
  const {
    isLoading,
    isAdvertiser,
    userRole,
    currentPage,
    totalPages,
    isArchiving,
    setIsArchiving,
    goToPage,
    handleArchiveSubmit,
    editMode,
    setEditMode,
    filteredContent,
    filteredCampaignList,
  } = useCampaigns({ searchValue, filters: campaignFilters.filters });
  const isManager = userRole === "Manager";
  const { sort, toggleSort } = useTableSort<SortColumn>();
  const { activeColumn, highlightProps } = useActiveColumn<SortColumn>(
    sort.column,
  );

  const columns = isAdvertiser ? ADVERTISER_COLUMNS : PROJECT_COLUMNS;
  const activeColumnIndex = columns.findIndex(
    (column) => column.key === activeColumn,
  );
  const sortableHeaders = toSortableHeaders(
    columns,
    sort,
    toggleSort,
    highlightProps,
  );

  const projectHeaders = isManager
    ? [...sortableHeaders, EDIT_HEADER, DELETE_HEADER]
    : sortableHeaders;
  const advertiserHeaders = isManager
    ? [...sortableHeaders, EDIT_HEADER]
    : sortableHeaders;

  const projectRows = useMemo<TableRow[]>(
    () =>
      sortRows(filteredContent.slice().reverse(), sort, projectSortValue).map(
        (item, index) => ({
          id: item.id ?? index,
          data: [
            <div key={`project-title-${item.id ?? index}`}>
              <Link href={`/campaigns/${item.id}`}>{item?.title}</Link>
            </div>,
            item?.subvendor?.organization_name,
            item?.artist_name,
            item?.created?.slice(0, 10) || "2025-01-13",
            ...(isManager
              ? [
                  <Link
                    href={`/campaigns/${item.id}`}
                    key={`project-manage-${item.id ?? index}`}
                  >
                    <div className="flex justify-center text-black dark:text-foreground">
                      <span className="sr-only">
                        Manage {item?.title ?? "campaign"}
                      </span>
                      <MdOutlineModeEditOutline size={20} aria-hidden="true" />
                    </div>
                  </Link>,
                  <div
                    key={`project-actions-${item.id ?? index}`}
                    className="flex justify-center gap-2"
                  >
                    <button
                      type="button"
                      aria-label={`Archive ${item?.title ?? "campaign"}`}
                      className={`rounded-full text-black dark:text-foreground ${
                        isArchiving === item.id ? "opacity-50" : ""
                      }`}
                      onClick={() => {
                        setEditMode(true);
                        setIsArchiving(
                          typeof item.id === "number" ? item.id : null,
                        );
                      }}
                      disabled={isArchiving === item.id}
                    >
                      <BsTrash size={20} aria-hidden="true" />
                    </button>
                  </div>,
                ]
              : []),
          ],
        }),
      ) ?? [],
    [
      filteredContent,
      sort,
      isArchiving,
      isManager,
      setEditMode,
      setIsArchiving,
    ],
  );

  const advertiserRows = useMemo<TableRow[]>(
    () =>
      sortRows(filteredCampaignList, sort, campaignSortValue).map(
        (item, index) => ({
          id: item.id ?? index,
          data: [
            <div key={`campaign-title-${item.id ?? index}`}>
              <Link href={`/campaigns/${item.id}`}>{item.song_title}</Link>
            </div>,
            item.song_artist,
            item.start_date,
            ...(isManager
              ? [
                  <Link
                    href={`/campaigns/${item.id}`}
                    key={`campaign-manage-${item.id ?? index}`}
                  >
                    <div className="flex justify-center text-black dark:text-foreground">
                      <span className="sr-only">
                        Manage {item.song_title ?? "campaign"}
                      </span>
                      <MdOutlineModeEditOutline size={20} aria-hidden="true" />
                    </div>
                  </Link>,
                ]
              : []),
          ],
        }),
      ) ?? [],
    [filteredCampaignList, sort, isManager],
  );

  return (
    <>
      {filterVisible && <CampaignFilters state={campaignFilters} />}
      <div>
        <span className="sr-only" role="status">
          {isLoading ? "Loading campaigns…" : ""}
        </span>
        {!isAdvertiser && (
          <Table
            aria-label="Campaign projects"
            className="border-0"
            highlightFirstCell={true}
            activeColumn={activeColumnIndex}
            headers={projectHeaders}
            rows={
              isLoading ? createTableSkeletonRows(projectHeaders) : projectRows
            }
            emptyState={<TableEmptyState label="No Data" />}
          />
        )}

        {isAdvertiser && (
          <div className="relative">
            <Table
              aria-label="Created campaigns"
              className="border-0"
              highlightFirstCell={true}
              activeColumn={activeColumnIndex}
              headers={advertiserHeaders}
              rows={
                isLoading
                  ? createTableSkeletonRows(advertiserHeaders)
                  : advertiserRows
              }
              emptyState={<TableEmptyState label="No Campaigns" />}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                if (!isLoading) goToPage(page);
              }}
            />
          </div>
        )}
      </div>

      {isManager && (
        <div
          className={`custom-dialog-overlay ${
            editMode
              ? "bg-black/30 backdrop-blur-md fixed inset-0 z-50"
              : "hidden"
          }`}
        >
          <Dialog
            visible={editMode}
            onHide={() => {
              setEditMode(false);
              setIsArchiving(null);
            }}
            breakpoints={{ "960px": "75vw", "640px": "100vw" }}
            style={{ width: "30vw" }}
            className="custom-dialog-overlay"
          >
            <div className="space-y-4 font-SansFlex text-gray-950 dark:text-foreground">
              <p className="text-[16px] font-[400] font-SansFlex">
                Are you sure you want to archive this item?
              </p>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={async () => {
                    if (isArchiving !== null) {
                      await handleArchiveSubmit(isArchiving);
                    }
                  }}
                  className="px-[16px] py-[8px] text-white rounded-full bg-blue-500"
                >
                  Yes
                </Button>

                <Button
                  onClick={() => {
                    setEditMode(false);
                    setIsArchiving(null);
                  }}
                  className="px-[16px] py-[8px] text-black dark:text-foreground rounded-full bg-slate-100 dark:bg-muted"
                >
                  No
                </Button>
              </div>
            </div>
          </Dialog>
        </div>
      )}
    </>
  );
};

export default Campaigns;
