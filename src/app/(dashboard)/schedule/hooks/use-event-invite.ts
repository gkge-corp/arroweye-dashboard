"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { sendEventInvite } from "@/actions/event-invite";

export const useEventInvite = (eventId?: number | string) => {
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const sendInvite = async () => {
    if (!eventId) return;

    setIsSendingInvite(true);
    try {
      const result = await sendEventInvite({
        eventId,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (result.success) {
        toast.success(result.message);
      } else {
        console.error("Send event invite failed:", result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Send event invite failed:", error);
      toast.error("The invites could not be sent.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  return { isSendingInvite, sendInvite };
};
