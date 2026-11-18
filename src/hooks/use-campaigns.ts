import { useCallback, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProjects, getCreatedCampaigns, archiveProject } from "@/services";

import { useAuth } from "@/context/auth-session";
import {
  isWithinDateRange,
  type CampaignFilters,
} from "@/hooks/use-campaign-filters";

interface UseCampaignsProps {
  searchValue: string;
  filters: CampaignFilters;
}

export const useCampaigns = ({ searchValue, filters }: UseCampaignsProps) => {
  const router = useRouter();
  const pathname = usePathname() || "/campaigns";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";
  const queryClient = useQueryClient();
  const { isAdvertiser, userProfile, isLoading: isAuthLoading } = useAuth();
  const userRole = userProfile?.role || "";

  const [editMode, setEditMode] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [isArchiving, setIsArchiving] = useState<number | null>(null);

  const PAGE_SIZE = 10;
  const normalizedSearchValue = searchValue.trim().toLowerCase();

  // restore page from URL (e.g. returning from /campaigns/[id])
  useEffect(() => {
    const pageParam = new URLSearchParams(searchParamsString).get("page");
    const page = Number.parseInt(pageParam ?? "", 10);

    if (!Number.isNaN(page) && page > 0) {
      setCurrentPage(page);
    }
  }, [searchParamsString]);

  const goToPage = (page: number) => {
    setCurrentPage(page);

    const params = new URLSearchParams(searchParamsString);
    params.set("page", String(page));

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    enabled: isAuthLoading === false && isAdvertiser === false,
  });

  const { data: campaignsData, isLoading: isCampaignsLoading } = useQuery({
    queryKey: ["campaigns", currentPage],
    queryFn: () => getCreatedCampaigns(currentPage, PAGE_SIZE),
    enabled: isAuthLoading === false && isAdvertiser === true,
  });

  const isLoading = isAuthLoading
    ? true
    : isAdvertiser
      ? isCampaignsLoading
      : isProjectsLoading;

  const content = isAdvertiser ? [] : (projectsData ?? []);
  const campaignList = campaignsData?.results ?? [];
  const totalCount = campaignsData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleArchiveSubmit = useCallback(
    async (projectId: number) => {
      try {
        setIsArchiving(projectId);
        await archiveProject(projectId, { archived: true });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        setEditMode(false);
      } catch (error) {
        console.error(`Error archiving project ${projectId}:`, error);
      } finally {
        setIsArchiving(null);
      }
    },
    [queryClient],
  );

  const filteredContent = content.filter(
    (item) =>
      !item.archived &&
      isWithinDateRange(item.created, filters.dateRange) &&
      (item.title.toLowerCase().includes(normalizedSearchValue) ||
        item.vendor.organization_name
          ?.toLowerCase()
          .includes(normalizedSearchValue) ||
        item.subvendor.organization_name
          ?.toLowerCase()
          .includes(normalizedSearchValue)),
  );

  const filteredCampaignList = campaignList.filter(
    (item) =>
      item.status === "active" &&
      isWithinDateRange(item.start_date, filters.dateRange) &&
      (item.song_title?.toLowerCase().includes(normalizedSearchValue) ||
        item.song_artist?.toLowerCase().includes(normalizedSearchValue)),
  );

  return {
    isLoading,
    isAdvertiser,
    userRole,
    currentPage,
    totalPages,
    totalCount,
    isArchiving,
    setIsArchiving,
    goToPage,
    handleArchiveSubmit,
    editMode,
    setEditMode,
    filteredContent,
    filteredCampaignList,
  };
};
