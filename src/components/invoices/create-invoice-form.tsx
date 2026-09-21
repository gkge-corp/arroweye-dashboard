"use client";
import React, { useEffect, useState } from "react";
import ls from "localstorage-slim";
import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/selectinput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreateInvoice,
  CreateService,
  getBusiness,
  getService,
} from "@/services";
import { ContentItem } from "@/types/contents";
import type { Business } from "@/types/api";
import { hasAccess, hasAccessExceptVendorManager } from "@/lib/utils";

// The shared Input/SelectInput still carry legacy hard-coded colours, including
// dark: variants. Those variants outrank an unprefixed utility regardless of
// class order, so the dark: overrides below are required, not redundant.
const CONTROL_CLASS =
  "rounded-md border-border bg-background text-sm text-foreground shadow-none dark:border-border dark:bg-background dark:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none";
const INPUT_CLASS = `h-10 px-3 placeholder:text-muted-foreground ${CONTROL_CLASS}`;
const SELECT_CLASS = `h-10 pl-3 pr-10 ${CONTROL_CLASS}`;
const LABEL_CLASS =
  "text-[11px] font-medium uppercase tracking-[.1rem] text-muted-foreground";
const ERROR_CLASS = "mt-1 text-xs text-destructive";

const CURRENCY_SYMBOLS: Record<string, string> = {
  Dollars: "$",
  Naira: "₦",
  Ethereum: "Ξ",
};

const formatAmount = (currency: string | number | undefined, value: number) =>
  `${CURRENCY_SYMBOLS[String(currency)] ?? "₦"}${value.toFixed(2)}`;
interface Item {
  id: number;
  item: string;
  cost: number | string;
  quantity: number | null;
  service_id?: number;
}

type ServiceError = {
  service_id: string | null;
  quantity: string | null;
  cost: string | null;
};

type ProjectErrors = {
  project_title: string;
  vendor_id: string | null;
  subvendor_id: string | number | null;
  artist_name: string | null;
  discount: string | null;
  po_code: string;
  currency: string;
  cost: string;
  services: ServiceError[];
};

interface ProjectFormData {
  project_title: string;
  vendor_id: string | number;
  subvendor_id: string | number;
  artist_name: string;
  discount: number;
  po_code: string;
  currency: string | number;
  services: { service_id: number; quantity: number; cost: number | string }[];
}

const CreateInvoiceForm = () => {
  const [selectedService, setSelectedService] = useState<number | string>();
  // const [selectedServiceCost, setSelectedServiceCost] = useState<
  //   number | string
  // >();
  const [isAddNewService, setIsAddNewService] = useState(false);

  const [content, setContent] = useState<ContentItem[] | null>(null);
  const [business, setBusiness] = useState<Business[] | null>(null);

  const [items, setItems] = useState<Item[]>([]);

  const [userLoggedInProfile, setUserLoggedInProfile] = useState<any>({});
  useEffect(() => {
    const content: any = ls.get("Profile", { decrypt: true });
    setUserLoggedInProfile(content?.user?.user_profile);
  }, []);

  const handleCurrencyChange = (value: string | number) => {
    setProjectFormData((prevState) => ({
      ...prevState,
      currency: value,
    }));

    setSelectedService(value);
  };

  const handleVendorChange = (value: string | number) => {
    setProjectFormData((prevData) => ({
      ...prevData,
      vendor_id: value,
    }));
  };

  const handleSubVendorChange = (value: string | number) => {
    setProjectFormData((prevData) => ({
      ...prevData,
      subvendor_id: value,
    }));
  };

  const addItemField = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        item: "",
        cost: "",
        quantity: null,
      },
    ]);
  };

  const removeItemField = (id: number) => {
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);

    setProjectFormData((prevData) => {
      const updatedServices = prevData.services.filter(
        (_, index) => index !== items.findIndex((item) => item.id === id),
      );
      return {
        ...prevData,
        services: updatedServices,
      };
    });
  };

  useEffect(() => {
    getService().then((fetchedContent) => {
      setContent(fetchedContent);
    });
  }, []);

  useEffect(() => {
    getBusiness().then((fetchedContent) => {
      setBusiness(fetchedContent);
    });
  }, []);

  const vendorOptions = business
    ? business
        .filter((item) => item.type === "Vendor")
        .map((item) => ({
          value: item.id ?? 0,
          label: item.organization_name ?? "",
        }))
    : [];

  const subVendorOptions = business
    ? business
        .filter((item) => item.type === "SubVendor")
        .map((item) => ({
          value: item.id ?? 0,
          label: item.organization_name ?? "",
        }))
    : [];

  const currencyOptions = [
    { value: "Dollars", label: "$USD" },
    { value: "Naira", label: "₦NGN" },
    { value: "Ethereum", label: "ΞETH" },
  ];

  const customOptions = [
    { value: 9, label: "Add new service", cost: 0 },
    ...(content?.map((item) => ({
      value: item.id ?? 0,
      label: item.name ?? "",
      cost: `${item.cost ?? 0}`,
    })) || []),
  ];

  const [formData, setFormData] = useState({
    name: "",
    cost: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    cost: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setProjectFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      name: "",
      cost: "",
    };

    if (!formData.name) {
      newErrors.name = "Please enter a valid name.";
    }
    if (!formData.cost) {
      newErrors.cost = "Please enter cost.";
    }

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== "");
    if (!hasErrors) {
      CreateService(formData)
        .then(() => {
          hideDialog();
          getService().then((fetchedContent) => {
            setContent(fetchedContent);
          });
        })
        .catch((err) => {
          console.error("Error submitting form:", err);
        });
    }
  };

  const [projectFormData, setProjectFormData] = useState<ProjectFormData>({
    project_title: "",
    vendor_id: "",
    subvendor_id: "",
    artist_name: "",
    discount: 0,
    po_code: "",
    currency: "",
    services: [
      {
        service_id: 0,
        quantity: 0,
        cost: 0,
      },
    ],
  });

  const [projectErrors, setProjectErrors] = useState<ProjectErrors>({
    project_title: "",
    vendor_id: "",
    subvendor_id: "",
    artist_name: "",
    discount: "",
    po_code: "",
    currency: "",
    cost: "",
    services: [
      {
        service_id: null,
        quantity: null,
        cost: null,
      },
    ],
  });

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subtotal = items.reduce(
      (sum, item) =>
        sum + parseFloat(item.cost.toString()) * (item.quantity || 1),
      0,
    );
    const customCost = subtotal;

    const newErrors: ProjectErrors = {
      project_title: "",
      vendor_id: null,
      subvendor_id: null,
      artist_name: "",
      discount: "",
      po_code: "",
      currency: "",
      cost: "",
      services: projectFormData.services.map(() => ({
        service_id: null,
        quantity: null,
        cost: null,
      })),
    };

    if (!projectFormData.project_title) {
      newErrors.project_title = "Please enter a Project Title.";
    }
    if (!projectFormData.currency) {
      newErrors.project_title = "Please select a Currency option.";
    }
    if (!projectFormData.vendor_id) {
      newErrors.vendor_id = "Please select a Vendor.";
    }
    if (!projectFormData.artist_name) {
      newErrors.artist_name = "Please enter an Artist Name.";
    }
    if (projectFormData.discount < 0 || projectFormData.discount > 100) {
      newErrors.discount = "Please enter a Discount value between 0 and 100%.";
    }
    if (!projectFormData.po_code) {
      newErrors.po_code = "Please enter a PO Code.";
    }
    if (customCost <= 0) {
      newErrors.cost = "Please enter a valid Cost.";
    }

    projectFormData.services.forEach((service, index) => {
      if (!service.service_id) {
        newErrors.services[index].service_id = "Please select a Service.";
      }
      if (service.quantity === null || service.quantity <= 0) {
        newErrors.services[index].quantity = "Please enter a valid quantity.";
      }
    });

    setProjectErrors(newErrors);

    const hasErrors = Object.entries(newErrors).some(([key, value]) => {
      if (key === "services") {
        return (
          value as { service_id: string | null; quantity: number | null }[]
        ).some(
          (service) => service.service_id !== null || service.quantity !== null,
        );
      }
      return value !== "" && value !== null;
    });

    if (!hasErrors) {
      const updatedFormData = {
        ...projectFormData,
        vendor_id: projectFormData.vendor_id
          ? parseInt(projectFormData.vendor_id.toString())
          : null,
        subvendor_id: projectFormData.subvendor_id
          ? parseInt(projectFormData.subvendor_id.toString())
          : null,
        // cost: customCost,
      };

      CreateInvoice(updatedFormData)
        .then(() => {
          hideDialog();
        })
        .catch((err) => {
          console.error("Error submitting form:", err);
        });
    } else {
      console.log("Form has errors. Not submitting.");
    }
  };

  const calculateTotal = (items: Item[]) => {
    const subtotal = items.reduce(
      (sum, item) =>
        sum +
        (item.cost ? parseFloat(item.cost.toString()) : 0) *
          (item.quantity || 1),
      0,
    );

    const serviceCharge = subtotal * 0.15;

    const tax = subtotal * 0.075;

    const total = subtotal + serviceCharge + tax;

    return { subtotal, serviceCharge, tax, total };
  };

  const hideDialog = () => {
    setIsAddNewService(false);
    setFormData({
      name: "",
      cost: "",
    });
    setErrors({
      name: "",
      cost: "",
    });
  };

  const { subtotal, serviceCharge, tax, total } = calculateTotal(items);

  return (
    <div className="my-5">
      {hasAccessExceptVendorManager(userLoggedInProfile, [""]) && (
        <form
          onSubmit={handleProjectSubmit}
          className="rounded-xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Create invoice
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Creating an invoice also creates the campaign it bills for.
              </p>
            </div>

            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Project Title */}
              <div className="w-full">
                <Input
                  label="PROJECT TITLE"
                  type="text"
                  name="project_title"
                  placeholder="Song or album title"
                  info="This is the title of the campaign, preferably the project name such as the song or album title."
                  value={projectFormData.project_title}
                  onChange={handleInputChange}
                  labelClassName={LABEL_CLASS}
                  className={INPUT_CLASS}
                />
                {projectErrors.project_title && (
                  <p className={ERROR_CLASS}>{projectErrors.project_title}</p>
                )}
              </div>

              {/* P.O Code */}
              <div className="w-full">
                <Input
                  label="P.O CODE"
                  type="text"
                  name="po_code"
                  placeholder="9-digit code"
                  info="A unique purchase order code for this invoice. Required, and no two invoices can share one."
                  value={projectFormData.po_code}
                  onChange={handleInputChange}
                  labelClassName={LABEL_CLASS}
                  className={INPUT_CLASS}
                />
                {projectErrors.po_code && (
                  <p className={ERROR_CLASS}>{projectErrors.po_code}</p>
                )}
              </div>

              {/* Currency */}
              <div className="w-full">
                <SelectInput
                  icon={true}
                  label="CURRENCY"
                  name="currency"
                  options={currencyOptions}
                  info="This is the currency in which the invoice is issued, and it will be the same amount reflected on the invoice."
                  value={projectFormData.currency}
                  onChange={handleCurrencyChange}
                  labelClassName={LABEL_CLASS}
                  className={SELECT_CLASS}
                />
                {projectErrors.currency && (
                  <p className={ERROR_CLASS}>{projectErrors.currency}</p>
                )}
              </div>

              {/* Select Vendor */}
              <div className="w-full">
                <SelectInput
                  icon={true}
                  label="SELECT VENDOR"
                  name="vendor"
                  options={vendorOptions}
                  onChange={handleVendorChange}
                  value={projectFormData.vendor_id}
                  labelClassName={LABEL_CLASS}
                  className={SELECT_CLASS}
                />
                {projectErrors.vendor_id && (
                  <p className={ERROR_CLASS}>{projectErrors.vendor_id}</p>
                )}
              </div>

              {/* Select Subvendor */}
              <div className="w-full">
                <SelectInput
                  icon={true}
                  name="subVendor"
                  label="SELECT SUBVENDOR"
                  options={subVendorOptions}
                  onChange={handleSubVendorChange}
                  value={projectFormData.subvendor_id}
                  labelClassName={LABEL_CLASS}
                  className={SELECT_CLASS}
                />
                {projectErrors.subvendor_id && (
                  <p className={ERROR_CLASS}>{projectErrors.subvendor_id}</p>
                )}
              </div>

              <div className="w-full">
                <Input
                  label="ARTIST NAME"
                  type="text"
                  name="artist_name"
                  placeholder="Performing artist"
                  info="The artist this campaign is being run for."
                  value={projectFormData.artist_name || ""}
                  onChange={handleInputChange}
                  labelClassName={LABEL_CLASS}
                  className={INPUT_CLASS}
                />
                {projectErrors.artist_name && (
                  <p className={ERROR_CLASS}>{projectErrors.artist_name}</p>
                )}
              </div>

              <div className="w-full">
                <Input
                  label="DISCOUNT %"
                  type="number"
                  name="discount"
                  placeholder="0"
                  info="This is an optional discount percentage offered by the Vendor."
                  value={projectFormData.discount || ""}
                  onChange={handleInputChange}
                  labelClassName={LABEL_CLASS}
                  className={INPUT_CLASS}
                />
                {projectErrors.discount && (
                  <p className={ERROR_CLASS}>{projectErrors.discount}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Services
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add at least one line item to enable saving.
                  </p>
                </div>
                {hasAccess(userLoggedInProfile, [""]) && (
                  <Button type="button" size="lg" onClick={addItemField}>
                    <Plus />
                    Add service
                  </Button>
                )}
              </div>

              {items.map((item: any, index) => (
                <div
                  className="flex items-end gap-4 rounded-lg border border-border bg-background p-4"
                  key={item.id}
                >
                  <div className="grid flex-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="w-full sm:col-span-2">
                      <div className="w-full">
                        <SelectInput
                          icon={true}
                          name="service"
                          label="SERVICE"
                          options={customOptions}
                          labelClassName={LABEL_CLASS}
                          className={SELECT_CLASS}
                          value={item.service_id || ""}
                          onChange={(value: string | number) => {
                            const selectedValue = Number(value);
                            const selectedOption = customOptions.find(
                              (opt) => opt.value === selectedValue,
                            );

                            console.log(selectedOption);

                            if (selectedValue === 9) {
                              setIsAddNewService(true);
                            } else {
                              const updatedItems = items.map((i) =>
                                i.id === item.id
                                  ? {
                                      ...i,
                                      service_id: selectedValue,
                                      cost: selectedOption?.cost || "",
                                    }
                                  : i,
                              );
                              setItems(updatedItems);

                              console.log(updatedItems);
                              const updatedServices = [
                                ...projectFormData.services,
                              ];
                              updatedServices[index] = {
                                ...updatedServices[index],
                                service_id: selectedValue,
                                cost: selectedOption?.cost || "",
                              };
                              setProjectFormData((prevData) => ({
                                ...prevData,
                                services: updatedServices,
                              }));
                            }
                          }}
                        />

                        {projectErrors.services[index]?.service_id && (
                          <p className={ERROR_CLASS}>
                            {projectErrors.services[index].service_id}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="w-full">
                      <Input
                        type="number"
                        name="cost"
                        placeholder="Cost"
                        label="COST"
                        labelClassName={LABEL_CLASS}
                        className={`${INPUT_CLASS} cursor-not-allowed text-muted-foreground`}
                        value={item.cost || ""}
                        readOnly
                        onChange={(e) => {
                          const updatedCost = e.target.value;

                          const updatedItems = items.map((i) =>
                            i.id === item.id ? { ...i, cost: updatedCost } : i,
                          );
                          setItems(updatedItems);

                          const updatedServices = [...projectFormData.services];
                          updatedServices[index] = {
                            ...updatedServices[index],
                          };
                          setProjectFormData((prevData) => ({
                            ...prevData,
                            services: updatedServices,
                          }));
                        }}
                      />
                      {projectErrors.cost && (
                        <p className={ERROR_CLASS}>{projectErrors.cost}</p>
                      )}
                    </div>

                    <div className="w-full">
                      <Input
                        type="number"
                        name="quantity"
                        label="QUANTITY"
                        placeholder="Quantity"
                        labelClassName={LABEL_CLASS}
                        className={INPUT_CLASS}
                        value={item.quantity}
                        onChange={(e) => {
                          const updatedQuantity = Number(e.target.value);

                          const updatedItems = items.map((i) =>
                            i.id === item.id
                              ? { ...i, quantity: updatedQuantity }
                              : i,
                          );
                          setItems(updatedItems);

                          const updatedServices = [...projectFormData.services];
                          updatedServices[index] = {
                            ...updatedServices[index],
                            quantity: updatedQuantity,
                          };
                          setProjectFormData((prevData) => ({
                            ...prevData,
                            services: updatedServices,
                          }));
                        }}
                      />
                      {projectErrors.services[index]?.quantity && (
                        <p className={ERROR_CLASS}>
                          {projectErrors.services[index].quantity}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    aria-label="Remove service"
                    className="mb-1 shrink-0 rounded-full"
                    onClick={() => removeItemField(item.id)}
                  >
                    <Minus />
                  </Button>
                </div>
              ))}
            </div>

            {selectedService && (
              <dl className="space-y-2 rounded-lg border border-border bg-background p-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="text-foreground">
                    {formatAmount(selectedService, subtotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Service charge (5%)</dt>
                  <dd className="text-foreground">
                    {formatAmount(selectedService, serviceCharge)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Tax (7.5%)</dt>
                  <dd className="text-foreground">
                    {formatAmount(selectedService, tax)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <dt className="font-medium text-foreground">Total</dt>
                  <dd className="font-medium text-foreground">
                    {formatAmount(selectedService, total)}
                  </dd>
                </div>
              </dl>
            )}

            {items.length > 0 && (
              <div className="flex justify-end border-t border-border pt-6">
                <Button type="submit" size="lg">
                  Save invoice
                </Button>
              </div>
            )}
          </div>
        </form>
      )}

      <Dialog
        open={isAddNewService}
        onOpenChange={(open) => {
          if (!open) {
            hideDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-foreground">
              Add service
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              New services become selectable on every invoice.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
                className={INPUT_CLASS}
              />
              {errors.name && <p className={ERROR_CLASS}>{errors.name}</p>}
            </div>
            <div>
              <Input
                type="text"
                name="cost"
                placeholder="Cost"
                value={formData.cost}
                onChange={handleInputChange}
                className={INPUT_CLASS}
              />
              {errors.cost && <p className={ERROR_CLASS}>{errors.cost}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full">
              <Plus />
              Add service
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateInvoiceForm;
