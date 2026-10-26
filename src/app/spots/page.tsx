import type { Metadata } from "next";
import DashboardLayoutClient from "../(dashboard)/dashboard-layout-client";
import SpotsPageClient from "./spots-page-client";

export const metadata: Metadata = {
  title: "Spots - Arroweye",
  description: "Explore local media rankings.",
};

export default function SpotsPage() {
  return (
    <DashboardLayoutClient requireAuth={false}>
      <SpotsPageClient />
    </DashboardLayoutClient>
  );
}
