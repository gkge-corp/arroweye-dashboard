import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Radio Monitor - Arroweye",
};

export default function RadioMonitorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
