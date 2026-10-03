"use client";
import React, { useEffect, useState } from "react";
import Logo from "@assets/arroreyelogoSm.svg";
import Image from "next/image";
import { getPaymentInvoice } from "@/services";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const DetailSkeleton = ({ className = "w-24" }: { className?: string }) => (
  <Skeleton className={`h-4 ${className}`} />
);

const Invoice = () => {
  const [content, setContent] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const params = useParams<{ id: string }>();
  const id = params?.id;

  useEffect(() => {
    if (!!id) {
      setIsLoading(true);
      setLoadError(false);
      getPaymentInvoice(Number(id))
        .then((fetchedContent) => {
          setContent(fetchedContent);
          setLoadError(!fetchedContent);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  const handlePrint = () => {
    const originalContent = document.body.innerHTML;
    const invoiceContent = document.getElementById("invoice")?.outerHTML;

    if (invoiceContent) {
      document.body.innerHTML = `
        <html>
          <head>
            <title>Print Invoice</title>
            <style>
              /* General styles for printing */
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                  -webkit-print-color-adjust: exact;
                }
                #invoice {
                  box-shadow: none;
                  width: 100%;
                  margin: auto;
                }
              }
              /* Custom styling for invoice */
              .invoice {
                width: 400px;
                margin: auto;
                padding: 20px;
                background: #ffffff;
                border-radius: 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                font-family: 'Google Sans Flex', sans-serif;
              }
            </style>
          </head>
          <body>${invoiceContent}</body>
        </html>
      `;

      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  return (
    <>
      {content?.project?.title && (
        <title>{`${content.project.title} - Arroweye`}</title>
      )}
      <div className="mt-20 flex min-h-[calc(100vh-5rem)] items-start justify-center bg-background px-4 font-SansFlex text-foreground">
        {loadError ? (
          <div className="w-full max-w-[400px] rounded-lg border border-destructive/30 bg-destructive/10 px-6 py-8 text-center text-destructive">
            <p className="font-semibold">Unable to load invoice</p>
            <p className="mt-2 text-sm">
              Please refresh the page and try again.
            </p>
          </div>
        ) : (
          <div
            id="invoice"
            className="w-full max-w-[400px] rounded-2xl border border-border bg-card px-6 py-[20px] text-card-foreground shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border pb-[10px] text-center">
              <Image src={Logo} alt="Logo" width={30} height={30} />
              {isLoading ? (
                <DetailSkeleton className="w-20" />
              ) : (
                <p className="text-xl font-semibold">Invoice</p>
              )}
            </div>

            <div className="mb-4 mt-4 space-y-[10px]">
              <div className="flex justify-between text-[16px]">
                <p className="font-[600]">Date Issued</p>
                <div className="font-[400]">
                  {isLoading ? (
                    <DetailSkeleton className="w-24" />
                  ) : (
                    content?.created && format(content?.created, "dd MMM yyyy")
                  )}
                </div>
              </div>
              <div className="flex justify-between text-[16px]">
                <p className="font-[600]">P.O Number</p>
                <div className="font-[400]">
                  {isLoading ? <DetailSkeleton /> : content?.po_code}
                </div>
              </div>
              <div className="flex justify-between text-[16px]">
                <p className="font-[600]">Invoice Number</p>
                <div className="font-[400]">
                  {isLoading ? <DetailSkeleton className="w-16" /> : id}
                </div>
              </div>
              <div className="flex justify-between text-[16px]">
                <p className="font-[600]">Issuer</p>
                <div className="font-[400]">
                  {isLoading ? (
                    <DetailSkeleton className="w-28" />
                  ) : (
                    content?.project?.vendor?.organization_name
                  )}
                </div>
              </div>
              <div className="flex justify-between text-[16px]">
                <p className="font-[600]">Customer</p>
                <div className="font-[400]">
                  {isLoading ? (
                    <DetailSkeleton className="w-28" />
                  ) : (
                    content?.project?.subvendor?.organization_name
                  )}
                </div>
              </div>
              <div className="flex justify-between text-[16px]">
                <p className="font-[600]">Email</p>
                <div className="font-[400]">
                  {isLoading ? (
                    <DetailSkeleton className="w-32" />
                  ) : (
                    content?.project?.subvendor?.owner_email
                  )}
                </div>
              </div>
            </div>

            <div className="text-[16px]">
              <p className="font-[600] mb-2">Services</p>
              {/* max-h-[70px] overflow-y-auto scrollbar-tiny */}
              <div
                className="space-y-2 pr-2 text-foreground"
                style={{ scrollbarWidth: "thin" }}
              >
                {isLoading
                  ? Array.from({ length: 3 }, (_, index) => (
                      <div
                        className="flex justify-between text-[16px]"
                        key={index}
                      >
                        <DetailSkeleton className="w-28" />
                        <DetailSkeleton className="w-16" />
                      </div>
                    ))
                  : content?.items?.map((item: any, index: number) => (
                      <div
                        className="flex justify-between text-[16px]"
                        key={index}
                      >
                        <p className="font-[400]">{item.service.name}</p>
                        <p className="font-[400]">
                          {item.service.cost} X {item.quantity}
                        </p>
                      </div>
                    ))}
              </div>
            </div>

            <div className="my-4 space-y-[10px] border-t border-border pt-4">
              <div className="flex justify-between text-[16px]">
                <p className=" font-[600]">Taxes</p>
                <div className=" font-[400]">
                  {isLoading ? (
                    <DetailSkeleton className="w-20" />
                  ) : (
                    <>
                      {content?.currency === "USD" ||
                      content?.currency === "Dollars"
                        ? "$"
                        : content?.currency === "Naira"
                          ? "₦"
                          : content?.currency}
                      {content?.tax_amount?.toLocaleString()}
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-[16px]">
                <p className=" font-[600]">Service Charge</p>
                <div className=" font-[400]">
                  {isLoading ? (
                    <DetailSkeleton className="w-20" />
                  ) : (
                    <>
                      {content?.currency === "USD" ||
                      content?.currency === "Dollars"
                        ? "$"
                        : content?.currency === "Naira"
                          ? "₦"
                          : content?.currency}
                      {content?.service_charge?.toLocaleString()}
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-[16px]">
                <p className=" font-[600]">Total Amount (+ Tax) </p>
                <div className=" font-[400]">
                  {isLoading ? (
                    <DetailSkeleton className="w-24" />
                  ) : (
                    <>
                      {content?.currency === "USD" ||
                      content?.currency === "Dollars"
                        ? "$"
                        : content?.currency === "Naira"
                          ? "₦"
                          : content?.currency}
                      {content?.total?.toLocaleString()}
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-[16px]">
                <p className=" font-[600]">Payment Method </p>
                <div className=" font-[400]">
                  {isLoading ? <DetailSkeleton className="w-20" /> : "Paystack"}
                </div>
              </div>
            </div>

            {isLoading ? (
              <Skeleton className="mt-2 h-11 w-full rounded-full" />
            ) : content?.status === "Paid" ? (
              <button
                onClick={handlePrint}
                className="print:hidden mt-2 w-full rounded-full bg-primary p-[10px] text-center text-[16px] font-[600] text-primary-foreground transition-all duration-700 ease-in-out hover:bg-orange-500"
              >
                Download Receipt
              </button>
            ) : (
              <button
                onClick={handlePrint}
                disabled
                className="print:hidden mt-2 w-full rounded-full bg-muted p-[10px] text-center text-[16px] font-[600] text-muted-foreground transition-all duration-700 ease-in-out"
              >
                UnPaid
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Invoice;
