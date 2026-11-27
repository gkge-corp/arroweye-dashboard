"use client";
import { useEffect, useState, type CSSProperties } from "react";
import ls from "localstorage-slim";
import { Input } from "@/components/ui/input";
import { IoFilter } from "react-icons/io5";
import Invoice from "./Invoice";
import { SelectInput } from "@/components/ui/selectinput";
import Users from "./Users";
import { Button } from "@/components/ui/button";
import { CreateInvoiceButton } from "@/components/invoices/create-invoice-section";
import type { CreateInvoiceState } from "@/hooks/use-create-invoice";
import { useElementHeight } from "@/hooks/use-element-height";
import { useStickyHeader } from "@/hooks/use-sticky-header";
import NotificationsMenu from "../../notifications-menu";

const InvoicesTab = ({ invoice }: { invoice: CreateInvoiceState }) => {
  const [userLoggedInProfile, setUserLoggedInProfile] = useState<any>({});
  const [activeTab, setActiveTab] = useState("Invoice");
  const [filter, setFilter] = useState(false);
  const [amountFilter, setAmountFilter] = useState<any>("");
  const [statusFilter, setStatusFilter] = useState<any>("");
  const [searchText, setSearchText] = useState<any>("");
  const toolbar = useElementHeight<HTMLDivElement>();
  const { sentinelRef, isSticky } = useStickyHeader();

  useEffect(() => {
    const content: any = ls.get("Profile", { decrypt: true });
    setUserLoggedInProfile(content?.user?.user_profile);
  }, []);

  return (
    <div
      className=" font-SansFlex mt-[50px]"
      style={{ "--table-sticky-top": `${toolbar.height}px` } as CSSProperties}
    >
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      <div
        ref={toolbar.ref}
        className="bg-background pb-[16px] lg:sticky lg:top-0 lg:z-20"
      >
        <div className="grid md:flex items-center gap-[20px] md:gap-[40px]">
          <div className="flex gap-[20px] items-center">
            <button
              className={`pb-[10px] text-[18px] transition-all duration-300 ${
                activeTab === "Invoice"
                  ? "border-b border-[#17845a] text-[#17845a] font-[400]"
                  : "font-[400]"
              }`}
              onClick={() => setActiveTab("Invoice")}
            >
              Invoices
            </button>
          </div>

          <div className="flex-grow">
            <div className="grid md:flex items-center md:justify-end gap-[10px]">
              {activeTab === "Invoice" && (
                <div className="flex-grow">
                  <Input
                    type="text"
                    placeholder="Search by title, label and artist..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full rounded-full bg-background! font-SansFlex placeholder:font-SansFlex text-[17px] placeholder:text-[17px]"
                  />
                </div>
              )}
              <div className="flex items-center lg:justify-between gap-[5px]">
                {activeTab === "Invoice" && (
                  <Button
                    type="button"
                    size="icon-lg"
                    aria-label={filter ? "Hide filters" : "Show filters"}
                    className="size-10 shrink-0 self-center rounded-full"
                    onClick={() => setFilter(!filter)}
                  >
                    <IoFilter />
                  </Button>
                )}
                <CreateInvoiceButton invoice={invoice} />
                {isSticky && (
                  <NotificationsMenu triggerClassName="relative hidden size-10 rounded-full text-foreground active:scale-[0.97] lg:inline-flex [&_svg]:size-[18px]!" />
                )}
              </div>
            </div>
          </div>
        </div>

        {filter && (
          <div className="text-center flex flex-wrap items-end gap-[5px] md:gap-[10px] mt-4">
            <div className="max-w-[150px] w-full rounded-full">
              <SelectInput
                rounded={true}
                options={[
                  { value: "", label: "Amount" },
                  { value: "htl", label: "High to Low" },
                  { value: "lth", label: "Low to High" },
                ]}
                onChange={(value) => setAmountFilter(value)}
              />
            </div>
            <div className="max-w-[100px] w-full rounded-full">
              <SelectInput
                rounded={true}
                options={[
                  { value: "", label: "Status" },
                  { value: "Paid", label: "Paid" },
                  { value: "Unpaid", label: "Unpaid" },
                ]}
                onChange={(value) => setStatusFilter(value)}
              />
            </div>
            <p
              className=" max-w-[120px] w-full cursor-pointer text-[14px] rounded-full px-[16px] py-[4px] hover:bg-orange-500 bg-[#000000] text-white inline"
              onClick={() => {
                setAmountFilter("");
                setStatusFilter("");
              }}
            >
              Clear Filters
            </p>
          </div>
        )}
      </div>

      <div>
        {activeTab === "Invoice" && (
          <Invoice
            amountFilter={amountFilter}
            statusFilter={statusFilter}
            searchText={searchText}
          />
        )}
        {activeTab === "Users" && <Users />}
      </div>
    </div>
  );
};

export default InvoicesTab;
