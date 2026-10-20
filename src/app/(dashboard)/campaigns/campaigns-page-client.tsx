"use client";

import { useState } from "react";
import InvoicesTab from "@/components/campaigns/InvoicesTab";
import Insight from "@/components/campaigns/Insight";
import CreateInvoiceSection from "@/components/invoices/create-invoice-section";
import { useCreateInvoice } from "@/hooks/use-create-invoice";

export default function CampaignsPageClient() {
  const [activeTab, setActiveTab] = useState("manage");
  const invoice = useCreateInvoice();

  return (
    <>
      <div className="lg:pt-[20px]">
        <div>
          {activeTab === "manage" && (
            <div className="">
              <CreateInvoiceSection invoice={invoice} className="lg:px-5" />

              {/* render the invoices for campaigns created */}
              <InvoicesTab invoice={invoice} />
            </div>
          )}
          {activeTab === "insights" && <Insight />}
        </div>
      </div>
    </>
  );
}
