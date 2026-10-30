import {
  mdiAccountCircleOutline,
  mdiAlbum,
  mdiBellOutline,
  mdiCalendarAlertOutline,
  mdiCalendarOutline,
  mdiCash,
  mdiFileDocumentOutline,
  mdiFolderOpenOutline,
  mdiInbox,
  mdiMusicCircle,
  mdiPlaySpeed,
  mdiPoundBox,
  mdiRewind,
  mdiShieldCheckOutline,
  mdiShieldLockOutline,
  mdiStarShooting,
  mdiWaveform,
  mdiWeb,
} from "@mdi/js";
import type { NotificationType } from "@/types/notifications";

export type NotificationIcon = {
  path: string;
  className: string;
};

// Tile colors from the project_single template (blue-nte, red-nte, ...).
const colors = {
  blue: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  teal: "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
  yellow:
    "bg-amber-200 text-[#947c01] dark:bg-amber-500/15 dark:text-amber-400",
  red: "bg-[#DD2E49] text-white",
  black: "bg-[#ebebe8] text-black dark:bg-zinc-800 dark:text-white",
  // Matches the color the API sends on scheduled-event notifications.
  event: "bg-[#29b0f1] text-white dark:bg-sky-500/15 dark:text-sky-400",
  green: "bg-[#e6ff99] text-[#01a733] dark:bg-lime-500/15 dark:text-lime-400",
  purple:
    "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  pink: "bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-400",
  orange:
    "bg-orange-100 text-orange-500 dark:bg-orange-500/15 dark:text-orange-400",
};

// Icon class names the API can send, with the template's icon and color.
export const mdiNotificationIcons = {
  "mdi-album": { path: mdiAlbum, className: colors.blue },
  "mdi-rewind": { path: mdiRewind, className: colors.teal },
  "mdi-play-speed": { path: mdiPlaySpeed, className: colors.yellow },
  "mdi-music-circle": { path: mdiMusicCircle, className: colors.red },
  "mdi-calendar-outline": { path: mdiCalendarOutline, className: colors.event },
  "mdi-pound-box": { path: mdiPoundBox, className: colors.green },
  "mdi-waveform": { path: mdiWaveform, className: colors.purple },
  "mdi-web": { path: mdiWeb, className: colors.pink },
  "mdi-star-shooting": { path: mdiStarShooting, className: colors.orange },
  "mdi-account-circle-outline": {
    path: mdiAccountCircleOutline,
    className: colors.black,
  },
  "mdi-calendar-alert-outline": {
    path: mdiCalendarAlertOutline,
    className: colors.black,
  },
  "mdi-inbox": { path: mdiInbox, className: colors.black },
  "mdi-shield-lock-outline": {
    path: mdiShieldLockOutline,
    className: colors.black,
  },
  "mdi-shield-check-outline": {
    path: mdiShieldCheckOutline,
    className: colors.black,
  },
  "mdi-folder-open-outline": {
    path: mdiFolderOpenOutline,
    className: colors.green,
  },
  "mdi-file-document-outline": {
    path: mdiFileDocumentOutline,
    className: colors.purple,
  },
  "mdi-cash": { path: mdiCash, className: colors.purple },
  "mdi-bell-outline": { path: mdiBellOutline, className: colors.blue },
} satisfies Record<string, NotificationIcon>;

export type MdiNotificationIconName = keyof typeof mdiNotificationIcons;

// Used when the API sends no icon we know. Checked in order; the first match wins.
const messageIconRules: {
  matches: RegExp;
  icon: MdiNotificationIconName;
}[] = [
  { matches: /\bplayed by\b/i, icon: "mdi-album" },
  { matches: /\bhighlights?\b/i, icon: "mdi-rewind" },
  { matches: /\bfirst play\b/i, icon: "mdi-play-speed" },
  { matches: /\bairplay\b/i, icon: "mdi-music-circle" },
  { matches: /\bsocial media\b/i, icon: "mdi-pound-box" },
  { matches: /\bDSP\b/, icon: "mdi-waveform" },
  { matches: /\bfeature post\b|\bpublished on\b/i, icon: "mdi-web" },
  { matches: /\bclocked in\b/i, icon: "mdi-account-circle-outline" },
  { matches: /\brescheduled\b/i, icon: "mdi-calendar-alert-outline" },
  { matches: /\barchived\b/i, icon: "mdi-inbox" },
  { matches: /\baccessed\b/i, icon: "mdi-shield-lock-outline" },
  {
    matches: /\bevent\b|\breminder\b|\bis today\b|\bcoming up\b/i,
    icon: "mdi-calendar-outline",
  },
];

const iconByType: Record<NotificationType, MdiNotificationIconName> = {
  Campaigns: "mdi-album",
  Milestones: "mdi-star-shooting",
  Security: "mdi-account-circle-outline",
  Assets: "mdi-folder-open-outline",
  Payments: "mdi-file-document-outline",
  Others: "mdi-bell-outline",
};

const isMdiNotificationIconName = (
  value: string,
): value is MdiNotificationIconName => value in mdiNotificationIcons;

export const getMdiNotificationIcon = (value?: unknown) => {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const parts = value.trim().split(/\s+/);
  const name = parts.find((part) => part.startsWith("mdi-"));

  if (!name || !isMdiNotificationIconName(name)) return undefined;

  return {
    name,
    ...mdiNotificationIcons[name],
    backgroundColor: parts.find((part) => /^#[0-9a-f]{3,8}$/i.test(part)),
  };
};

export const getFallbackNotificationIcon = (
  type: NotificationType,
  message: string,
): NotificationIcon => {
  const rule = messageIconRules.find(({ matches }) => matches.test(message));
  return mdiNotificationIcons[rule?.icon ?? iconByType[type]];
};

export const hasMdiNotificationIcon = (
  value: unknown,
  name: MdiNotificationIconName,
) => getMdiNotificationIcon(value)?.name === name;

export const isNotificationIconUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;

  const icon = value.trim();
  if (!icon) return false;

  return (
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("data:image/") ||
    icon.startsWith("blob:") ||
    icon.startsWith("/") ||
    icon.includes("/") ||
    /\.[a-z0-9]{2,5}(?:[?#]|$)/i.test(icon)
  );
};
