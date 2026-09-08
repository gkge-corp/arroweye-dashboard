import { mdiArrowDown } from "@mdi/js";
import Icon from "@mdi/react";
import { formatDistanceToNow } from "date-fns";
import type { Ref } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ApiNotification,
  NotificationAction,
  NotificationType,
} from "@/types/notifications";
import { normalizeNotificationType } from "@/types/notifications";
import {
  getCampaignIconConfig,
  getMdiNotificationIcon,
  hasMdiNotificationIcon,
  isNotificationIconUrl,
  notificationIconConfig,
  type NotificationIconConfig,
} from "./notification-icon-config";

interface NotificationCardProps {
  notification: ApiNotification;
  elementRef?: Ref<HTMLElement>;
}

const iconKeyByType = {
  Security: "security",
  Milestones: "milestones",
  Assets: "assets",
  Payments: "payments",
  Others: "others",
} as const satisfies Record<
  Exclude<NotificationType, "Campaigns">,
  keyof typeof notificationIconConfig
>;

const disabledActionsByType: Partial<
  Record<NotificationType, NotificationAction["type"][]>
> = {
  Assets: ["Manage", "Pay", "Delete"],
  Milestones: ["Manage", "Pay", "Delete"],
  Payments: ["Manage", "Pay", "Delete"],
};

const formatRelativeDate = (dateString: string | null) => {
  if (!dateString) return "Recently";

  const date = new Date(dateString);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : formatDistanceToNow(date, { addSuffix: true });
};

const getIconConfig = (
  type: NotificationType,
  message: string,
): NotificationIconConfig =>
  type === "Campaigns"
    ? getCampaignIconConfig(message)
    : notificationIconConfig[iconKeyByType[type]];

const getSpinUrl = (url: string) =>
  url.replace(/\/spins\/spin\/([^/?#]+)/, "/spins/$1");

const parseMessage = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <span key={index} className="font-bold text-neutral-950 dark:text-white">
        {part.slice(2, -2)}
      </span>
    ) : (
      part
    ),
  );
};

export function NotificationCard({
  notification,
  elementRef,
}: NotificationCardProps) {
  const type = normalizeNotificationType(notification.type);
  const message = notification.content ?? "";
  const timeAgo = formatRelativeDate(notification.created);
  const iconConfig = getIconConfig(type, message);
  const {
    Icon: NotificationIcon,
    containerClassName,
    ignoreApiIcon,
  } = iconConfig;
  const iconValue = ignoreApiIcon ? undefined : notification.icon;
  const mdiIcon = getMdiNotificationIcon(iconValue);
  const isIconUrl = isNotificationIconUrl(iconValue);
  const isArtwork = type === "Assets" && isIconUrl;
  const isSpinNotification =
    type === "Campaigns" &&
    hasMdiNotificationIcon(notification.icon, "mdi-album");
  const disabledActions = disabledActionsByType[type] ?? ["Pay", "Delete"];

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Link has been copied!");
  };

  const resolveActionUrl = (action: NotificationAction) => {
    const url = action.url?.trim() ?? "";
    return isSpinNotification && ["Share", "View"].includes(action.type)
      ? getSpinUrl(url)
      : url;
  };

  const openAction = (action: NotificationAction, url: string) => {
    if (action.type === "View" && isSpinNotification) {
      localStorage.setItem(
        "spinNotification",
        JSON.stringify({ content: message, timeAgo }),
      );
      window.dispatchEvent(new Event("spinNotificationUpdate"));
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const actionsWithUrls = notification.actions
    .map((action) => ({ action, url: resolveActionUrl(action) }))
    .filter(({ url }) => Boolean(url));

  return (
    <article
      ref={elementRef}
      data-notification-id={notification.id}
      className={cn(
        "flex items-start gap-3 border-b border-neutral-100 bg-white px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-950",
        notification.read === false && "bg-neutral-50/30 dark:bg-zinc-900/5",
      )}
    >
      {isIconUrl ? (
        <img
          src={iconValue}
          alt="Notification artwork"
          className={cn(
            "h-[72px] w-14 shrink-0 rounded-lg object-cover",
            isArtwork && "h-[168px] w-[116px] rounded-[4px]",
          )}
        />
      ) : (
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
            containerClassName,
          )}
          style={
            mdiIcon?.backgroundColor
              ? { backgroundColor: mdiIcon.backgroundColor }
              : undefined
          }
        >
          {mdiIcon ? (
            <Icon path={mdiIcon.path} size={0.9} />
          ) : (
            <NotificationIcon className="size-4" />
          )}
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-neutral-400 dark:text-zinc-500">
          {timeAgo}
        </p>
        <p
          className={cn(
            "text-[15px] leading-[18px] text-neutral-800 dark:text-zinc-200",
            isArtwork && "text-base leading-6",
          )}
        >
          {parseMessage(message)}
        </p>

        {actionsWithUrls.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {actionsWithUrls.map(({ action, url }, index) => {
              const isShare = action.type === "Share";
              const isDownload = action.type === "Download";
              const disabled = disabledActions.includes(action.type);
              const label =
                isArtwork && action.type === "View" ? "Discover" : action.type;

              return (
                <Button
                  key={`${action.type}-${index}`}
                  type="button"
                  disabled={disabled}
                  aria-label={isDownload ? "Download" : undefined}
                  onClick={() => {
                    if (isShare) {
                      void copyLink(url);
                      return;
                    }
                    openAction(action, url);
                  }}
                  className={cn(
                    "h-8 cursor-pointer rounded-full px-4 text-xs font-semibold shadow-none transition-colors",
                    isShare
                      ? "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      : "border-0 bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200",
                    isDownload && "w-8 px-0",
                    isArtwork && "h-10 px-4 text-sm",
                  )}
                >
                  {isDownload ? <Icon path={mdiArrowDown} size={0.8} /> : label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
