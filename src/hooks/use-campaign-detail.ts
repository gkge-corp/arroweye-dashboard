import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-session";
import {
  getBusinessStaff,
  getSingleCampaign,
  getSingleProject,
  getStoredSingleCampaign,
  getStoredSingleProject,
} from "@/services";
import type { AppProject, BusinessStaff } from "@/types/api";

const isNetworkError = (err: any) =>
  !err.response ||
  err.code === "ERR_NETWORK" ||
  err.code === "ECONNABORTED" ||
  err.message?.includes("timeout");

export const getCampaignDetailQueryKey = (
  id: string | undefined,
  isAdvertiser: boolean,
) => ["campaign-detail", isAdvertiser ? "advertiser" : "project", id];

export function useCampaignDetail(id?: string) {
  const queryClient = useQueryClient();
  const { isAdvertiser, isLoading: isAuthLoading, userProfile } = useAuth();
  const [content, setContent] = useState<any | null>(null);

  const campaignId = Number(id);
  const hasCampaignId = Boolean(id) && Number.isFinite(campaignId);
  const campaignDetailQueryKey = useMemo(
    () => getCampaignDetailQueryKey(id, isAdvertiser),
    [id, isAdvertiser],
  );

  const cachedContent = useMemo(() => {
    if (!hasCampaignId || isAuthLoading) return null;

    if (isAdvertiser) {
      return getStoredSingleCampaign(campaignId);
    }

    const cachedProject = getStoredSingleProject();
    return cachedProject?.id === campaignId ? cachedProject : null;
  }, [campaignId, hasCampaignId, isAdvertiser, isAuthLoading]);

  const {
    data: fetchedContent,
    error: contentError,
    isFetching: isContentFetching,
  } = useQuery({
    queryKey: campaignDetailQueryKey,
    queryFn: () =>
      isAdvertiser
        ? getSingleCampaign(campaignId)
        : getSingleProject(campaignId),
    enabled: hasCampaignId && !isAuthLoading,
    initialData: cachedContent,
  });

  const [hasNetworkError, setHasNetworkError] = useState(false);

  const refreshContent = useCallback(async () => {
    if (!hasCampaignId || isAuthLoading) return;
    setHasNetworkError(false);
    await queryClient.invalidateQueries({ queryKey: campaignDetailQueryKey });
  }, [campaignDetailQueryKey, hasCampaignId, isAuthLoading, queryClient]);

  useEffect(() => {
    if (!hasCampaignId || isAuthLoading) return;
    setContent(cachedContent ?? null);
  }, [cachedContent, hasCampaignId, isAuthLoading]);

  useEffect(() => {
    if (fetchedContent) {
      setContent(fetchedContent);
    }
  }, [fetchedContent]);

  useEffect(() => {
    setHasNetworkError(Boolean(contentError && isNetworkError(contentError)));
  }, [contentError]);

  const { data: staffSuggestions = [] } = useQuery<BusinessStaff[]>({
    queryKey: ["business-staff", content?.subvendor?.id],
    queryFn: async () =>
      (await getBusinessStaff(Number(content?.subvendor?.id))) ?? [],
    enabled: Boolean(content?.subvendor?.id),
  });

  const subvendorStaff =
    !isAdvertiser && content ? ((content as AppProject).watchers ?? []) : null;

  return {
    content,
    setContent,
    subvendorStaff,
    staffSuggestions,
    userLoggedInProfile: userProfile,
    isAdvertiser,
    isContentFetching,
    hasNetworkError,
    refreshContent,
  };
}
