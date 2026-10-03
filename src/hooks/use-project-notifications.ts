import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-session";
import {
  fetchCampaignDetail,
  getCampaignDetailQueryKey,
} from "@/hooks/use-campaign-detail";

// Observes the campaign detail cache (fetched by the campaign page) without
// triggering a fetch, so the menu shows the same notifications as the dock.
// The queryFn is still required: observers share the query's options, and an
// invalidation refetch would otherwise run with no fetcher.
export const useProjectNotifications = (projectId?: number | string) => {
  const { isAdvertiser } = useAuth();
  const id = projectId == null ? undefined : String(projectId);
  const { data } = useQuery({
    queryKey: getCampaignDetailQueryKey(id, isAdvertiser),
    queryFn: (): Promise<unknown> =>
      fetchCampaignDetail(Number(id), isAdvertiser),
    enabled: false,
  });

  return id
    ? (data as { notifications?: unknown } | null | undefined)?.notifications
    : undefined;
};
