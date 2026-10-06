import type { UserProfile } from "@/types/api";

// Only this business manages the shared radio monitor report.
const RADIO_MONITOR_BUSINESS = "pine & gingr";

export const canManageRadioMonitor = (
  profile?: Pick<UserProfile, "business_name"> | null,
) => profile?.business_name?.trim().toLowerCase() === RADIO_MONITOR_BUSINESS;
