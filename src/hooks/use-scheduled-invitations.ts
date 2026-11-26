"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  cancelScheduledInvitation,
  listScheduledInvitations,
} from "@/actions/mailer-schedule";

export const SCHEDULED_INVITATIONS_KEY = ["mailer", "schedules"];

export const useScheduledInvitations = () => {
  const queryClient = useQueryClient();

  const schedulesQuery = useQuery({
    queryKey: SCHEDULED_INVITATIONS_KEY,
    queryFn: listScheduledInvitations,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelScheduledInvitation,
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Scheduled invitation cancelled");
      void queryClient.invalidateQueries({ queryKey: SCHEDULED_INVITATIONS_KEY });
    },
    onError: (error) => {
      console.error("Cancelling the schedule failed:", error);
      toast.error("The schedule could not be cancelled.");
    },
  });

  return {
    schedules: schedulesQuery.data ?? [],
    isLoading: schedulesQuery.isLoading,
    cancelSchedule: cancelMutation.mutate,
    cancellingId: cancelMutation.isPending ? cancelMutation.variables : undefined,
  };
};
