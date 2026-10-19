"use client";

import Icon from "@mdi/react";
import { mdiAccountPlusOutline } from "@mdi/js";
import type { AppUser } from "@/types/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const predefinedColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-indigo-500",
  "bg-gray-500",
];

interface CampaignMembersListProps {
  members: AppUser[] | null;
  canAddMember: boolean;
  onAddMemberClick: () => void;
  onUserClick: (user: any) => void;
}

export function CampaignMembersList({
  members,
  canAddMember,
  onAddMemberClick,
  onUserClick,
}: CampaignMembersListProps) {
  return (
    <TooltipProvider>
      <div className="flex space-x-[5px]">
        {members?.map((user, index) => (
          <Tooltip key={user?.id || index}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-lg"
                variant="ghost"
                className="size-[50px] rounded-full p-0"
                onClick={() => onUserClick(user)}
              >
                <Avatar className="size-[50px]">
                  <AvatarFallback
                    className={`${predefinedColors[index % predefinedColors.length]} text-xs font-bold tracking-[0.12em] text-white`}
                  >
                    {user?.user_profile?.fullname?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">
                  View {user?.user_profile?.fullname}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{user?.user_profile?.fullname}</TooltipContent>
          </Tooltip>
        ))}

        {canAddMember && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-lg"
                variant="secondary"
                className="size-[50px] rounded-full bg-[#ffdead]"
                onClick={onAddMemberClick}
              >
                <Icon path={mdiAccountPlusOutline} size={1} />
                <span className="sr-only">Add member</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add member</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
