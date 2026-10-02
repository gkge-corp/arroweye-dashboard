import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-session";
import { getCampaignDetailQueryKey } from "@/hooks/use-campaign-detail";

// Observes the campaign detail cache (fetched by the campaign page) without
// triggering a fetch, so the menu shows the same notifications as the dock.
export const useProjectNotifications = (projectId?: number | string) => {
  const { isAdvertiser } = useAuth();
  const id = projectId == null ? undefined : String(projectId);
  const { data } = useQuery<{ notifications?: unknown } | null>({
    queryKey: getCampaignDetailQueryKey(id, isAdvertiser),
    enabled: false,
  });

  return id ? data?.notifications : undefined;
};
