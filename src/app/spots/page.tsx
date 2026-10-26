import type { Metadata } from "next";
import SpotsPageClient from "./spots-page-client";

export const metadata: Metadata = {
  title: "Spots - Arroweye",
  description: "Explore local media rankings.",
};

export default function SpotsPage() {
  return <SpotsPageClient />;
}
