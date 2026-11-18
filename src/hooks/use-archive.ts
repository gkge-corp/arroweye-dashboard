import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { archiveProject, getProjects } from "../services";
import {
  isWithinDateRange,
  type CampaignFilters,
} from "@/hooks/use-campaign-filters";

interface UseArchiveProps {
  searchValue: string;
  filters: CampaignFilters;
}

export const useArchive = ({ searchValue, filters }: UseArchiveProps) => {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [isArchiving, setIsArchiving] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const content = projectsData || null;

  const filteredContent = (content || [])
    .filter((item) => item.archived === true)
    .filter((item) => isWithinDateRange(item.created, filters.dateRange))
    .filter((item) =>
      item.title?.toLowerCase().includes(searchValue.toLowerCase()),
    );

  const handleArchiveSubmit = useCallback(
    async (projectId: string, archive: boolean) => {
      try {
        setIsArchiving(projectId);
        await archiveProject(Number(projectId), { archived: archive });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        setEditMode(false);
      } catch (error) {
        console.error(
          `Error ${archive ? "archiving" : "unarchiving"} project ${projectId}:`,
          error,
        );
      } finally {
        setIsArchiving(null);
      }
    },
    [queryClient],
  );

  const handleCopyPin = useCallback((pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  }, []);

  return {
    editMode,
    setEditMode,
    isArchiving,
    setIsArchiving,
    copiedPin,
    isLoading,
    filteredContent,
    handleArchiveSubmit,
    handleCopyPin,
  };
};
