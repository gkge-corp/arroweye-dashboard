"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SendEventEmail } from "@/services/api/schedule";
import type { EventEmailType } from "../utils/event-email-types";

export const useEventInvite = (eventId?: number | string) => {
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const sendInvite = async (emailType: EventEmailType) => {
    if (!eventId) return;

    setIsSendingInvite(true);
    try {
      await SendEventEmail({ id: eventId, emailType });
      toast.success("Email sent to campaign members.");
    } catch (error) {
      console.error("Send event email failed:", error);
      toast.error("The email could not be sent.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  return { isSendingInvite, sendInvite };
};
