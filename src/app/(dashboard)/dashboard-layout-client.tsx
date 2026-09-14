"use client";
import { FC, ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./sidebar";
import TopNav from "./top-nav";
import { usePathname } from "next/navigation";
import { useProtectedRoute } from "./hooks/use-protected-route";
import ScrollToTopButton from "@/components/scroll-to-top-button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";

interface LayoutProps {
  children: ReactNode;
  withBorder?: boolean;
  requireAuth?: boolean;
}

const DashboardContentSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-4 w-48 max-w-full" />
    </div>
    <div className="grid gap-5 md:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-5 rounded-[8px] border p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-[120px]" />
          </div>
          <Skeleton className="h-10 w-28 lg:h-14 lg:w-36" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mx-auto aspect-square w-full max-w-[350px] rounded-[8px]" />
        </div>
      ))}
    </div>
  </div>
);

function CreateSidebar() {
  return (
    <aside className="flex h-screen w-[72px] shrink-0 flex-col border-r border-[#dedede] bg-white sm:w-[108px]">
      <Link
        href="/campaigns"
        aria-label="Back to campaigns"
        className="flex h-[134px] shrink-0 items-center justify-center border-b border-[#dedede] outline-none transition-opacity duration-150 ease-out hover:opacity-65 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset active:opacity-45"
      >
        <Image
          src="/tools.svg"
          alt="Market"
          width={49}
          height={28}
          priority
          className="h-auto w-[38px] sm:w-[49px]"
        />
      </Link>
    </aside>
  );
}

const DashboardLayoutClient: FC<LayoutProps> = ({
  children,
  withBorder = true,
  requireAuth = true,
}) => {
  const pathname = usePathname();
  const isPublicSetupLanding = pathname === "/campaigns/setup";
  const { isAuthenticated, isLoading } = useProtectedRoute(
    requireAuth && !isPublicSetupLanding,
  );
  const isSetupLanding =
    pathname === "/create" ||
    pathname === "/campaigns/setup" ||
    pathname === "/campaigns/setup/launch";
  const useLogoOnlySidebar = pathname === "/create";

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="z-50">
          {useLogoOnlySidebar ? <CreateSidebar /> : <Sidebar />}
        </div>
        <div
          id="dashboard-scroll-container"
          className={`flex-1 flex flex-col overflow-y-scroll scrollbar-hide flex-grow ${isSetupLanding ? "bg-background" : ""}`}
        >
          {!isSetupLanding && <TopNav />}
          <main
            className={
              isSetupLanding
                ? "min-h-full w-full"
                : `w-full max-w-6xl mx-auto ${withBorder ? "border border-gray-100" : ""} ${
                    pathname !== "/campaigns/spins-notifications" &&
                    pathname !== "/campaigns/setup/custom" &&
                    pathname !== "/campaigns/setup/promoter"
                      ? "mx-[20px]"
                      : ""
                  } border-none rounded-xl`
            }
          >
            {isSetupLanding ? (
              <div className="min-h-screen bg-background" />
            ) : (
              <DashboardContentSkeleton />
            )}
          </main>
          <ToastContainer />
        </div>
        <ScrollToTopButton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className=" z-50">
        {useLogoOnlySidebar ? <CreateSidebar /> : <Sidebar />}
      </div>
      <div
        id="dashboard-scroll-container"
        className={`flex-1 flex flex-col overflow-y-scroll scrollbar-hide flex-grow ${isSetupLanding ? "bg-background" : ""}`}
      >
        {!isSetupLanding && <TopNav />}
        <main
          className={
            isSetupLanding
              ? "min-h-full w-full"
              : `w-full max-w-6xl mx-auto ${withBorder ? "border border-gray-100" : ""} ${
                  pathname !== "/campaigns/spins-notifications" &&
                  pathname !== "/campaigns/setup/custom" &&
                  pathname !== "/campaigns/setup/promoter"
                    ? "mx-[20px]"
                    : ""
                } border-none rounded-xl`
          }
        >
          {children}
        </main>
        <ToastContainer />
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default DashboardLayoutClient;
