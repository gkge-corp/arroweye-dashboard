import type { Metadata } from "next";
import CanvasPageClient from "./canvas-page-client";

export const metadata: Metadata = {
  title: "Canvas - Arroweye",
  description: "Discover artiste profiles.",
};

export default function CanvasPage() {
  return <CanvasPageClient />;
}
