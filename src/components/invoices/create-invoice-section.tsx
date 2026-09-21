"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import CreateInvoiceForm from "./create-invoice-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-session";
import { cn, hasAccessExceptVendorManager } from "@/lib/utils";

interface CreateInvoiceSectionProps {
  className?: string;
}

const CreateInvoiceSection = ({ className }: CreateInvoiceSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userProfile } = useAuth();

  if (!hasAccessExceptVendorManager(userProfile, [""])) {
    return null;
  }

  return (
    <div className={cn(className)}>
      <Button
        type="button"
        size="lg"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Plus />}
        {isOpen ? "Cancel" : "Create Invoice"}
      </Button>

      {isOpen && <CreateInvoiceForm />}
    </div>
  );
};

export default CreateInvoiceSection;
