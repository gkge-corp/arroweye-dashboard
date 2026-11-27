"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  cancelScheduledInvitation,
  listInvitations,
} from "@/actions/mailer-schedule";
import type { ScheduledInvitation } from "@/types/mailer";

export const SCHEDULED_INVITATIONS_KEY = ["mailer", "schedules"];

const isStillSending = (schedule: ScheduledInvitation) =>
  schedule.status === "scheduled" || schedule.status === "active";

export const useScheduledInvitations = () => {
  const queryClient = useQueryClient();

  const schedulesQuery = useQuery({
    queryKey: SCHEDULED_INVITATIONS_KEY,
    queryFn: listInvitations,
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

  const invitations = schedulesQuery.data ?? [];

  return {
    schedules: invitations
      .filter(isStillSending)
      .sort((a, b) => a.sendOn.localeCompare(b.sendOn)),
    history: invitations.filter((invitation) => !isStillSending(invitation)),
    isLoading: schedulesQuery.isLoading,
    cancelSchedule: cancelMutation.mutate,
    cancellingId: cancelMutation.isPending ? cancelMutation.variables : undefined,
  };
};
