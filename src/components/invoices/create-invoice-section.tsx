"use client";

import { Plus } from "lucide-react";

import CreateInvoiceForm from "./create-invoice-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CreateInvoiceState } from "@/hooks/use-create-invoice";

interface CreateInvoiceProps {
  invoice: CreateInvoiceState;
  className?: string;
}

export const CreateInvoiceButton = ({
  invoice,
  className,
}: CreateInvoiceProps) =>
  invoice.canCreate ? (
    <Button
      type="button"
      size="icon-lg"
      aria-label={invoice.isOpen ? "Cancel invoice" : "Create invoice"}
      aria-expanded={invoice.isOpen}
      className={cn("size-10 shrink-0 self-center rounded-full", className)}
      onClick={invoice.toggle}
    >
      <Plus
        className={cn(
          "transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
          invoice.isOpen && "rotate-45",
        )}
      />
    </Button>
  ) : null;

// Animating grid rows between 0fr and 1fr lets the form expand to its natural height.
const CreateInvoiceSection = ({ invoice, className }: CreateInvoiceProps) =>
  invoice.canCreate && invoice.isRendered ? (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
        invoice.isOpen
          ? "grid-rows-[1fr] opacity-100 starting:grid-rows-[0fr] starting:opacity-0"
          : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <CreateInvoiceForm agencyAccess={invoice.agencyAccess} />
      </div>
    </div>
  ) : null;

export default CreateInvoiceSection;
