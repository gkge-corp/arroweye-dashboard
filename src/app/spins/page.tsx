import type { Metadata } from "next";
import DashboardLayoutClient from "../(dashboard)/dashboard-layout-client";
import SpinsTableComponent from "../(dashboard)/payments/component/SpinsTableComponent";

export const metadata: Metadata = {
  title: "Spins - Arroweye",
  description: "Global Afrobeats DJ Chart.",
};

const SpinsChart = () => {
  return (
    <DashboardLayoutClient requireAuth={false}>
      <SpinsTableComponent />
    </DashboardLayoutClient>
  );
};

export default SpinsChart;
