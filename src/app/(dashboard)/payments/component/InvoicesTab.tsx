"use client";
import { useEffect, useState, type CSSProperties } from "react";
import ls from "localstorage-slim";
import { Input } from "@/components/ui/input";
import { IoFilter } from "react-icons/io5";
import Invoice from "./Invoice";
import { SelectInput } from "@/components/ui/selectinput";
import Users from "./Users";
import { IoIosAdd, IoMdAddCircleOutline } from "react-icons/io";
import { CreateBusiness } from "@/services";
import { DropDownInput } from "@/components/ui/dropdownInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { TbBuildingBank } from "react-icons/tb";
import CompanyDetailsForm from "@/components/campaigns/CompanyDetailsForm";
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
  const [visible, setVisible] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);
  const toolbar = useElementHeight<HTMLDivElement>();
  const { sentinelRef, isSticky } = useStickyHeader();

  const [formData, setFormData] = useState({
    email: "",
    organization_name: "",
    fullname: "",
    type: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    organization_name: "",
    fullname: "",
    type: "",
  });

  // const handleInputChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  // ) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newState = {
        ...prev,
        [name]: value,
      };
      return newState;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      email: "",
      organization_name: "",
      fullname: "",
      type: "",
    };

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.organization_name) {
      newErrors.organization_name = "Please enter a business name.";
    }
    if (!formData.fullname) {
      newErrors.fullname = "Please enter a full name.";
    }
    if (!formData.type) {
      newErrors.type = "Please select a type.";
    }

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== "");
    console.log("Form Data being submitted:", formData);
    if (!hasErrors) {
      CreateBusiness(formData)
        .then(() => {
          console.log("Form submitted successfully!");
          hideDialog();
        })
        .catch((err) => {
          console.error("Error submitting form:", err);
        });
    }
  };

  const showDialog = () => {
    setVisible(true);
  };

  const hideDialog = () => {
    setVisible(false);
    setFormData({
      email: "",
      organization_name: "",
      fullname: "",
      type: "",
    });
    setErrors({
      email: "",
      organization_name: "",
      fullname: "",
      type: "",
    });
  };

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

      <CompanyDetailsForm
        visible={detailsModal}
        onHide={() => setDetailsModal(false)}
      />
      <Dialog
        open={visible}
        onOpenChange={(open) => {
          if (open) {
            setVisible(true);
          } else {
            hideDialog();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border-border bg-card p-6 text-card-foreground shadow-2xl sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[12px] font-[500] uppercase tracking-[.1rem] text-muted-foreground">
              + Add Users
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add a user to your business.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="scrollbar-hide space-y-4">
            <div className="relative z-10 grid gap-3">
              <div>
                <DropDownInput
                  type="email"
                  name="email"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={(e) => handleInputChange(e)}
                  className="border-border bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground dark:bg-transparent"
                  // options={[
                  //   {
                  //     value: "1",
                  //     label: "Option 1",
                  //     email: "option1@example.com",
                  //   },
                  //   {
                  //     value: "2",
                  //     label: "Option 2",
                  //     email: "option2@example.com",
                  //   },
                  //   {
                  //     value: "3",
                  //     label: "Option 3",
                  //     email: "option3@example.com",
                  //   },
                  // ]}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <Input
                  type="text"
                  name="organization_name"
                  placeholder="Business Name"
                  value={formData.organization_name}
                  onChange={handleInputChange}
                  className="border-border bg-transparent text-[17px] text-foreground placeholder:text-muted-foreground dark:bg-transparent"
                />
                {errors.organization_name && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.organization_name}
                  </p>
                )}
              </div>
              {formData.type && (
                <div>
                  <Input
                    type="text"
                    name="fullname"
                    placeholder="Full Name"
                    value={formData.fullname}
                    onChange={handleInputChange}
                    className="border-border bg-transparent font-SansFlex text-[17px] text-foreground placeholder:text-muted-foreground dark:bg-transparent"
                  />
                  {errors.fullname && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.fullname}
                    </p>
                  )}
                </div>
              )}
              <div className=" hidden">
                <div className="flex items-center gap-[5px] cursor-pointer">
                  <IoMdAddCircleOutline size={20} />
                  <p>Add Contact</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-[10px] items-end">
                <div className="w-full">
                  <SelectInput
                    icon={true}
                    name="type"
                    className="bg-transparent dark:bg-transparent"
                    options={[
                      { value: "Vendor", label: "Vendor" },
                      { value: "SubVendor", label: "SubVendor" },
                    ]}
                    value={formData.type}
                    onChange={(value) =>
                      handleInputChange({
                        target: { name: "type", value: String(value) },
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                    // onChange={handleInputChange}
                  />
                  {errors.type && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.type}
                    </p>
                  )}
                </div>
                <div className="w-full">
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="submit"
                      className="h-[50px] w-full rounded-full bg-foreground px-[12px] py-[12px] font-SansFlex text-[14px] text-background hover:bg-orange-500 hover:text-white"
                    >
                      <IoIosAdd />
                      <span>Add User</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesTab;
