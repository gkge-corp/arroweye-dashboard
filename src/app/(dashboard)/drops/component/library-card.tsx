import React from "react";
import { FaGoogleDrive, FaDropbox } from "react-icons/fa";
import { GrOnedrive } from "react-icons/gr";
import { FaCloudArrowUp } from "react-icons/fa6";
import { SiWetransfer } from "react-icons/si";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ButtonProps {
  element: React.ReactElement;
  tooltip: string;
}

interface CardProps {
  title: string;
  mainIcon?:
    | "GoogleDrive"
    | "WeTransfer"
    | "OneDrive"
    | "DropBox"
    | "PCloud"
    | null;
  buttons: ButtonProps[];
  userInitials?: string;
  userFullName?: string;
  userEmail?: string;
  userColor?: string;
}

export const LibraryCardSkeleton = () => (
  <Card
    aria-hidden="true"
    className="h-[200px] w-full justify-between gap-0 rounded-[20px] border-border px-[10px] py-[20px] shadow-none"
  >
    <CardHeader className="p-0 px-2">
      <Skeleton className="h-6 w-3/5 rounded-md" />
    </CardHeader>
    <CardFooter className="flex items-center justify-between p-0 pl-2">
      <Skeleton className="size-6 rounded-md" />
      <div className="flex items-center justify-end space-x-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="size-10 rounded-full" />
        ))}
      </div>
    </CardFooter>
  </Card>
);

const LibraryCard: React.FC<CardProps> = ({
  title,
  mainIcon = null,
  buttons = [],
}) => {
  // Function to render the appropriate icon based on the mainIcon value
  const renderIcon = () => {
    if (!mainIcon) return null;

    const iconClassName =
      "text-muted-foreground opacity-80 transition-colors group-hover:text-primary";

    switch (mainIcon) {
      case "GoogleDrive":
        return <FaGoogleDrive size={20} className={iconClassName} />;
      case "WeTransfer":
        return <SiWetransfer size={27} className={iconClassName} />;
      case "OneDrive":
        return <GrOnedrive size={25} className={iconClassName} />;
      case "DropBox":
        return <FaDropbox size={22} className={iconClassName} />;
      case "PCloud":
        return <FaCloudArrowUp size={25} className={iconClassName} />;
      default:
        return <FaGoogleDrive size={20} className={iconClassName} />;
    }
  };

  return (
    <Card className="group h-[200px] w-full justify-between gap-0 rounded-[20px] border-border px-[10px] py-[20px] shadow-none transition-colors hover:border-[#87CEEB] hover:bg-accent/50">
      <CardHeader className="p-0">
        <CardTitle className="px-2 text-[16px] font-medium leading-normal text-primary md:text-[18px]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex items-center justify-between p-0 pl-2">
        {renderIcon()}
        <div className="flex items-center justify-end space-x-2">
          {buttons.map((button, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>{button.element}</TooltipTrigger>
              <TooltipContent>{button.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default LibraryCard;
