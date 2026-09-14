"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { format, parseISO } from "date-fns";
import { FiInfo } from "react-icons/fi";
import { HiOutlineCube } from "react-icons/hi";
import { IoFilter } from "react-icons/io5";
import { IoIosArrowRoundDown } from "react-icons/io";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDrops } from "../../../hooks/use-drops";
import LibraryCard, { LibraryCardSkeleton } from "./component/library-card";
import { DropsIcon } from "../sidebar";
import NotificationsMenu from "../notifications-menu";
import Icon from "@mdi/react";
import { mdiArrowDown, mdiContentCopy, mdiMinus } from "@mdi/js";

type SelectOption = {
  label: string;
  value: string | number;
};

const emptyFilters = {
  search: "",
  year: "",
  month: "",
  vendor: "",
  subvendor: "",
  platform: "",
};

const yearOptions: SelectOption[] = [
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
];

const monthOptions: SelectOption[] = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const platformOptions: SelectOption[] = [
  { value: "GoogleDrive", label: "GoogleDrive" },
  { value: "WeTransfer", label: "WeTransfer" },
  { value: "OneDrive", label: "OneDrive" },
  { value: "DropBox", label: "DropBox" },
  { value: "PCloud", label: "PCloud" },
];

const ensureHttps = (url: string) => {
  if (url.match(/^https?:\/\//)) {
    return url;
  }

  return `https://${url}`;
};

const InfoTooltip = ({ info }: { info: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="inline-flex text-muted-foreground transition-colors hover:text-primary"
      >
        <FiInfo />
        <span className="sr-only">More information</span>
      </button>
    </TooltipTrigger>
    <TooltipContent side="right" className="max-w-60">
      {info}
    </TooltipContent>
  </Tooltip>
);

const FilterSelect = ({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <Select value={value || undefined} onValueChange={onChange}>
    <SelectTrigger className="h-[40px] rounded-full border-border bg-background text-primary shadow-none">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem
          key={`${placeholder}-${option.value}`}
          value={String(option.value)}
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const AssetsLibrary = () => {
  const {
    content,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    filter,
    setFilter,
    selectedUser,
    setSelectedUser,
    userLoggedInProfile,
    filters,
    setFilters,
    updateFilters,
    vendorOptions,
    subVendorOptions,
    deleteLoading,
    deleteDialog,
    setDeleteDialog,
    projectPin,
    setProjectPin,
    pinEntered,
    setPinEntered,
    pinError,
    setPinError,
    dropIdToBeDeleted,
    setDropIdToBeDeleted,
    handleUserClick,
    handleCopyLink,
    handleDelete,
  } = useDrops();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const isStickyRef = useRef(false);
  const [isSticky, setIsSticky] = useState(false);
  const [fullHeaderHeight, setFullHeaderHeight] = useState(0);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;

    if (!loadMoreElement || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.unobserve(loadMoreElement);
        void fetchNextPage();
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useLayoutEffect(() => {
    const sentinel = stickySentinelRef.current;
    const stickyHeader = stickyHeaderRef.current;
    const scrollContainer = document.getElementById(
      "dashboard-scroll-container",
    );

    if (!sentinel || !stickyHeader || !scrollContainer) return;

    const measureFullHeader = () => {
      if (isStickyRef.current) return;

      const nextHeight = stickyHeader.offsetHeight;
      setFullHeaderHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };

    const updateStickyState = (synchronous = false) => {
      const rootTop = scrollContainer.getBoundingClientRect().top;
      const sentinelBottom = sentinel.getBoundingClientRect().bottom;
      const nextIsSticky = isStickyRef.current
        ? sentinelBottom <= rootTop + 2
        : sentinelBottom <= rootTop;

      if (nextIsSticky === isStickyRef.current) return;

      isStickyRef.current = nextIsSticky;
      const updateState = () => setIsSticky(nextIsSticky);

      if (synchronous) {
        flushSync(updateState);
      } else {
        updateState();
      }
    };

    measureFullHeader();
    updateStickyState();

    const resizeObserver = new ResizeObserver(measureFullHeader);
    resizeObserver.observe(stickyHeader);
    const handleScroll = () => updateStickyState(true);
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <div ref={stickySentinelRef} className="h-px" aria-hidden="true" />
      <div
        ref={stickyHeaderRef}
        className={cn(
          "sticky top-0 z-40 flex flex-col [overflow-anchor:none]",
          isSticky &&
            "-mx-5 border-b border-zinc-200 bg-background px-6 dark:border-zinc-800 lg:px-10",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-[10px]",
            isSticky ? "h-16 justify-between" : "mb-12.5",
          )}
        >
          <div className="flex min-w-0 items-center gap-[10px]">
            <DropsIcon className="shrink-0 text-primary" size={24} />
            <p className="truncate text-[27px] font-bold text-primary">
              Asset Library
            </p>
          </div>
          {isSticky && (
            <NotificationsMenu triggerClassName="relative size-9 rounded-full text-foreground active:scale-[0.97] [&_svg]:size-[18px]!" />
          )}
        </div>
        {!isSticky && (
          <>
            <div>
              <div className="flex h-12 items-center gap-2.5">
                <div className="grow">
                  <Input
                    type="text"
                    placeholder="Search..."
                    className="h-auto w-full rounded-full border-border bg-background! text-[17px] text-foreground shadow-none placeholder:text-[17px]"
                    value={filters.search}
                    onChange={(e) => updateFilters("search", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  size="icon-lg"
                  aria-label={filter ? "Hide filters" : "Show filters"}
                  className="size-10 shrink-0 mt-2 self-center rounded-full"
                  onClick={() => setFilter(!filter)}
                >
                  <IoFilter />
                </Button>
              </div>
            </div>
            {filter && (
              <div className="mt-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="w-full max-w-[150px]">
                    <FilterSelect
                      placeholder="Year"
                      options={yearOptions}
                      value={filters.year}
                      onChange={(value) => updateFilters("year", value)}
                    />
                  </div>
                  <div className="w-full max-w-[150px]">
                    <FilterSelect
                      placeholder="Month"
                      options={monthOptions}
                      value={filters.month}
                      onChange={(value) => updateFilters("month", value)}
                    />
                  </div>
                  {userLoggedInProfile?.business_type === "Vendor" && (
                    <>
                      <div className="w-full max-w-[150px]">
                        <FilterSelect
                          placeholder="Vendor"
                          options={vendorOptions}
                          value={filters.vendor}
                          onChange={(value) => updateFilters("vendor", value)}
                        />
                      </div>
                      <div className="w-full max-w-[150px]">
                        <FilterSelect
                          placeholder="Sub-Vendor"
                          options={subVendorOptions}
                          value={filters.subvendor}
                          onChange={(value) =>
                            updateFilters("subvendor", value)
                          }
                        />
                      </div>
                    </>
                  )}
                  <div className="w-full max-w-[150px]">
                    <FilterSelect
                      placeholder="Platform"
                      options={platformOptions}
                      value={filters.platform}
                      onChange={(value) => updateFilters("platform", value)}
                    />
                  </div>
                  <Button
                    type="button"
                    className="h-[40px] rounded-full bg-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 px-4 text-white hover:bg-zinc-800"
                    onClick={() => setFilters(emptyFilters)}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {isSticky && fullHeaderHeight > 64 && (
        <div aria-hidden="true" style={{ height: fullHeaderHeight - 64 }} />
      )}
      <div className="mb-[100px] mt-4">
        <div className="mb-10 grid h-full place-items-center gap-2 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item: any) => (
            <div key={item.id} className="group w-full">
              <LibraryCard
                title={`${item.folder_name}`}
                mainIcon={item.drop_type || "N/A"}
                userInitials={`${item.first_name.charAt(0)}${item.last_name.charAt(0)}`}
                userFullName={`${item.first_name}  ${item.last_name}`}
                userEmail={item.first_name}
                userColor="bg-blue-500"
                buttons={[
                  {
                    element: (
                      <Button
                        type="button"
                        size="icon-lg"
                        aria-label="Open drop link"
                        className="hidden size-10 rounded-full bg-blue-500 text-white hover:bg-blue-600 group-hover:inline-flex"
                        onClick={() =>
                          window.open(ensureHttps(item.link), "_blank")
                        }
                      >
                        <Icon path={mdiArrowDown} className="size-3.5" />
                      </Button>
                    ),
                    tooltip: "Download",
                  },
                  {
                    element: (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        aria-label="Remove drop"
                        disabled={deleteLoading}
                        className="size-10 rounded-full"
                        onClick={() => {
                          setDropIdToBeDeleted(item.id);
                          setProjectPin(item.project_pin);
                          setDeleteDialog(true);
                        }}
                      >
                        <Icon path={mdiMinus} className="size-3.5" />
                      </Button>
                    ),
                    tooltip: "Delete Drop",
                  },
                  {
                    element: (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        aria-label="Copy drop link"
                        className="size-10 rounded-full"
                        onClick={() => handleCopyLink(item.link)}
                      >
                        <Icon path={mdiContentCopy} className="size-3.5" />
                      </Button>
                    ),
                    tooltip: "Copy Link",
                  },
                  {
                    element: (
                      <Button
                        type="button"
                        size="icon-lg"
                        aria-label={`View ${item.first_name} ${item.last_name}`}
                        className="size-10 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => handleUserClick(item)}
                      >
                        <span className="font-Poppins text-sm font-semibold tracking-[.08rem]">
                          {`${item.first_name.charAt(0)}${item.last_name.charAt(0)}`}
                        </span>
                      </Button>
                    ),
                    tooltip: `${item.first_name}  ${item.last_name}`,
                  },
                ]}
              />
            </div>
          ))}
          {(isLoading || isFetchingNextPage) &&
            Array.from({ length: 3 }).map((_, index) => (
              <LibraryCardSkeleton key={`drop-skeleton-${index}`} />
            ))}
        </div>
        {content.length === 0 && !isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No drops found.
          </p>
        )}
        <div
          ref={loadMoreRef}
          className="flex min-h-10 items-center justify-center"
          aria-live="polite"
        >
          {(isLoading || isFetchingNextPage) && (
            <span className="sr-only">Loading drops…</span>
          )}
        </div>
      </div>
      <Dialog
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <InfoTooltip info="This modal contains details about the user who created the drop, including their profile information and other relevant metadata." />
              <DialogTitle className="text-[12px] font-[400] uppercase tracking-[.1rem] text-muted-foreground">
                Information
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Details about the user who created this drop.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 font-SansFlex text-foreground">
              <p className="text-[30px] font-[600]">
                {selectedUser.user.user_profile.fullname}
              </p>
              <div className="text-[16px]">
                <p className="font-[400] text-muted-foreground">Email:</p>
                <p className="font-[600]">
                  {selectedUser.user.user_profile.staff_email}
                </p>
              </div>
              <div className="text-[16px]">
                <p className="font-[400] text-muted-foreground">Role</p>
                <p className="font-[600] text-[#01a733]">
                  {selectedUser.user.user_profile.role}
                </p>
              </div>
              <div className="text-[16px]">
                <p className="font-[400] text-muted-foreground">Project</p>
                <button
                  type="button"
                  className="text-left font-[600] text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    const campaignUrl = `${window.location.origin}/campaigns/${selectedUser.project}`;
                    window.open(campaignUrl, "_blank");
                  }}
                >
                  {selectedUser.project_title}
                </button>
              </div>
              <div className="text-[16px]">
                <p className="font-[400] text-muted-foreground">Member since</p>
                <p className="font-[600]">
                  {selectedUser.user.created
                    ? format(parseISO(selectedUser.user.created), "dd MMM yyyy")
                    : "Unknown"}
                </p>
              </div>
              <div className="text-[16px]">
                <p className="font-[400] text-muted-foreground">Last login</p>
                <p className="font-[600]">
                  {selectedUser.user.last_login
                    ? format(
                        parseISO(selectedUser.user.last_login),
                        "dd MMM yyyy",
                      )
                    : "Never"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteDialog !== false}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <InfoTooltip info="Delete the dropzone selected" />
              <DialogTitle className="text-[12px] font-[400] uppercase tracking-[.1rem] text-muted-foreground">
                Delete Drop
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Confirm the project pin before deleting this drop.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            name="projectPin"
            autoComplete="new-password"
            className="h-[50px] border-border bg-transparent text-foreground"
            placeholder="Enter Pin"
            value={pinEntered}
            error={pinError ? "Wrong password entered" : undefined}
            onChange={(e) => {
              const newPin = e.target.value;
              setPinEntered(newPin);
              if (newPin.length >= 6) {
                setPinError(newPin !== projectPin);
              } else {
                setPinError(false);
              }
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pinEntered.length < 6 || pinError}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (dropIdToBeDeleted !== null) {
                  handleDelete(dropIdToBeDeleted);
                }
              }}
            >
              Delete Drop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AssetsLibrary;
