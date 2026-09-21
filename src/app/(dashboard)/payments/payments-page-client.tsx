"use client";

import { useState } from "react";
import CreateInvoiceSection from "@/components/invoices/create-invoice-section";
import InvoicesTab from "./component/InvoicesTab";
import Insight from "./component/Insight";

export default function PaymentsPageClient() {
  const [activeTab, setActiveTab] = useState("Manage");

  return (
    <>
      <div className=" lg:p-[20px]">
        <div>
          {activeTab === "Manage" && (
            <div className="">
              {" "}
              <CreateInvoiceSection />
              <InvoicesTab />
            </div>
          )}
          {activeTab === "Insights" && <Insight />}
        </div>
      </div>
    </>
  );
}
