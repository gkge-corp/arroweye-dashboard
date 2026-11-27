import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-session";
import type { AuthenticatedUser, UserOrganization } from "@/types/api";

const CREATE_INVOICE_TRANSITION_MS = 300;
const PLATFORM_STAFF_ROLES = ["admin", "staff"];
const INVOICE_MANAGER_ROLES = ["owner", "manager"];

export interface InvoiceAgencyAccess {
  // Platform staff invoice on behalf of any agency, so they pick one.
  canPickAnyAgency: boolean;
  managedAgencies: UserOrganization[];
}

// Mirrors the API: only platform staff or an agency's owners/managers can invoice.
const getInvoiceAgencyAccess = (
  user: AuthenticatedUser | null,
): InvoiceAgencyAccess => ({
  canPickAnyAgency: PLATFORM_STAFF_ROLES.includes(user?.platform_role ?? ""),
  managedAgencies: (user?.organizations ?? []).filter(
    (org) => org.kind === "agency" && INVOICE_MANAGER_ROLES.includes(org.role),
  ),
});

export const useCreateInvoice = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const { user } = useAuth();
  const agencyAccess = getInvoiceAgencyAccess(user);

  // Keep the form mounted until the collapse finishes so it can animate out.
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      return;
    }
    const timeout = setTimeout(
      () => setIsRendered(false),
      CREATE_INVOICE_TRANSITION_MS,
    );
    return () => clearTimeout(timeout);
  }, [isOpen]);

  return {
    canCreate:
      agencyAccess.canPickAnyAgency || agencyAccess.managedAgencies.length > 0,
    agencyAccess,
    isOpen,
    isRendered: isOpen || isRendered,
    toggle: () => setIsOpen((open) => !open),
  };
};

export type CreateInvoiceState = ReturnType<typeof useCreateInvoice>;
