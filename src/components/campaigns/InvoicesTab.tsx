"use client";
import { useState, useEffect, type CSSProperties } from "react";
import { Input } from "@/components/ui/input";
import { IoFilter } from "react-icons/io5";
import Archive from "./Archive";
import Campaigns from "./campaigns-table";
import { Button } from "../ui/button";
import { CreateInvoiceButton } from "../invoices/create-invoice-section";
import type { CreateInvoiceState } from "@/hooks/use-create-invoice";
import { useElementHeight } from "@/hooks/use-element-height";
import { useStickyHeader } from "@/hooks/use-sticky-header";
import NotificationsMenu from "@/app/(dashboard)/notifications-menu";

const InvoicesTab = ({ invoice }: { invoice: CreateInvoiceState }) => {
  const [activeTab, setActiveTab] = useState<"Campaigns" | "Archive">(
    "Campaigns",
  );
  const [filter, setFilter] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const toolbar = useElementHeight<HTMLDivElement>();
  const { sentinelRef, isSticky } = useStickyHeader();

  useEffect(() => {
    setFilter(false);
  }, [activeTab]);

  return (
    <div
      className="mt-[50px] lg:px-5 lg:pb-5"
      style={{ "--table-sticky-top": `${toolbar.height}px` } as CSSProperties}
    >
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      <div
        ref={toolbar.ref}
        className="bg-background pb-4 lg:sticky lg:top-0 lg:z-20"
      >
        <div className="grid items-center gap-[20px] md:flex md:gap-10">
          <div className="flex gap-5 items-center  ">
            <button
              className={`pb-2.5 text-[18px] transition-all duration-300 ${
                activeTab === "Campaigns"
                  ? "border-b border-[#17845a] text-[#17845a] font-normal"
                  : "font-normal"
              }`}
              onClick={() => setActiveTab("Campaigns")}
            >
              Campaigns
            </button>
            <button
              className={`pb-[10px] text-[18px] transition-all duration-300 ${
                activeTab === "Archive"
                  ? "border-b border-[#17845a] text-[#17845a] font-normal"
                  : "font-normal"
              }`}
              onClick={() => setActiveTab("Archive")}
            >
              Archive
            </button>
          </div>

          <div className="grow">
            <div className="flex items-center justify-end gap-[10px]">
              <div className="grow font-SansFlex">
                <Input
                  type="text"
                  placeholder="Search by title, label and artist..."
                  className="h-auto w-full rounded-full border-border bg-background! text-[17px] text-foreground shadow-none placeholder:text-[17px]"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
              <Button
                type="button"
                size="icon-lg"
                aria-label={filter ? "Hide filters" : "Show filters"}
                className="size-10 shrink-0 self-center rounded-full"
                onClick={() => setFilter(!filter)}
              >
                <IoFilter />
              </Button>
              <CreateInvoiceButton invoice={invoice} />
              {isSticky && (
                <NotificationsMenu triggerClassName="relative hidden size-10 rounded-full text-foreground active:scale-[0.97] lg:inline-flex [&_svg]:size-[18px]!" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className={`transition-opacity duration-500 ease-in-out ${
            activeTab === "Campaigns" ? "opacity-100" : "opacity-0 absolute"
          }`}
        >
          {activeTab === "Campaigns" && (
            <Campaigns filterVisible={filter} searchValue={searchValue} />
          )}
        </div>
        <div
          className={`transition-opacity duration-500 ease-in-out ${
            activeTab === "Archive" ? "opacity-100" : "opacity-0 absolute"
          }`}
        >
          {activeTab === "Archive" && (
            <Archive searchValue={searchValue} filterVisible={filter} />
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesTab;
