"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-session";
import { getCampaignWallet } from "@/services";
import { Button } from "@/components/ui/button";
import SecurityFraudSection from "./security-fraud-section";

const featureCards = [
  {
    step: 1,
    title: "Connect with trusted DJs",
    image: "/setup-dj.webp",
  },
  {
    step: 2,
    title: "Track every verified play",
    image: "/setup-track.webp",
  },
  {
    step: 3,
    title: "Optimize in real time",
    image: "/setup-optimize.webp",
  },
];

const platformStats = [
  { label: "Campaigns completed", value: "40" },
  { label: "Active campaigns", value: "15" },
  { label: "Total DJs", value: "100+" },
];

const getFirstName = (name?: string, email?: string) => {
  const value = name?.trim() || email?.split("@")[0] || "there";
  return value.split(/[\s._-]+/)[0];
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

export default function CreateContent() {
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);
  const { isAuthenticated, user, userProfile } = useAuth();
  const { data: walletData, isLoading: isWalletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: getCampaignWallet,
    enabled: isAuthenticated,
  });

  const firstName = getFirstName(userProfile?.fullname, user?.email);
  const greeting = getGreeting();
  const tokenBalance = Number(walletData?.available_balance) || 0;
  const formattedBalance = new Intl.NumberFormat("en-NG").format(tokenBalance);

  useEffect(() => {
    if (!isSecurityExpanded) return;

    const scrollTimer = window.setTimeout(() => {
      const scrollContainer = document.getElementById(
        "dashboard-scroll-container",
      );

      scrollContainer?.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: "smooth",
      });
    }, 500);

    return () => window.clearTimeout(scrollTimer);
  }, [isSecurityExpanded]);

  return (
    <div className="bg-background text-foreground">
      <section
        className={`flex h-dvh px-4 sm:px-8 transition-[padding] duration-500 ease-in-out ${
          isSecurityExpanded ? "pt-10 pb-2" : "py-10"
        }`}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col">
          <div className="my-auto w-full">
            <header className="text-center">
              <h1 className="text-[25px] font-semibold leading-tight tracking-[-0.025em] sm:text-[27px]">
                {greeting}
                {isAuthenticated ? `, ${firstName}` : ""}!
              </h1>
              {/* {isAuthenticated && (
            <>
              <p className="mt-3 text-[16px] leading-none text-muted-foreground">
                Your token balance is
              </p>
              <div
                className="mt-[18px] min-h-[52px] text-[50px] font-medium leading-none tracking-[-0.035em] tabular-nums sm:text-[54px]"
                aria-live="polite"
              >
                {isWalletLoading ? (
                  <span className="mx-auto block h-[52px] w-28 animate-pulse rounded-md bg-muted" />
                ) : (
                  formattedBalance
                )}
              </div>
            </>
          )} */}

              <div className="mt-6 flex items-center justify-center">
                <Button
                  asChild
                  className="h-11 min-w-[160px] rounded-full px-7 text-sm font-semibold"
                >
                  <Link href="/campaigns/setup/launch">Start Campaign</Link>
                </Button>
              </div>
            </header>
            <section
              className={`pb-[35px] text-center transition-[margin] mt-6 duration-500 ease-in-out`}
              aria-label="Trusted partners"
            >
              <p className="text-muted-foreground text-[12px] font-semibold tracking-[0.12em] uppercase">
                Trusted by artistes and labels globally
              </p>
              <div
                className="mt-[36px] flex items-center justify-center gap-[20px] text-muted"
                aria-hidden="true"
              >
                <span className="h-0 w-0 border-x-[20px] border-b-[35px] border-x-transparent border-b-current" />
                <span className="h-[35px] w-[84px] bg-current" />
                <span className="size-[39px] rounded-full bg-current" />
              </div>
            </section>

            <section className="mt-[40px]" aria-labelledby="how-it-works-title">
              <div className="grid gap-[14px] sm:grid-cols-3">
                {featureCards.map((card) => (
                  <article
                    key={card.title}
                    className="group relative aspect-video overflow-hidden rounded-[4px] bg-none"
                  >
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 33vw, 320px"
                      className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.025]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/5" />
                    <span className="absolute left-3 top-4 flex size-[22px] items-center justify-center rounded-full bg-background text-[11px] font-semibold text-foreground shadow-sm">
                      {card.step}
                    </span>
                    <h3 className="absolute inset-x-[10px] bottom-[10px] text-[12px] font-semibold leading-tight text-white">
                      {card.title}
                    </h3>
                  </article>
                ))}
              </div>
            </section>

            <section
              className="mt-[19px] grid gap-[14px] sm:grid-cols-3"
              aria-label="Platform statistics"
            >
              {platformStats.map((stat) => (
                <article
                  key={stat.label}
                  className="flex h-[112px] flex-col justify-center rounded-[4px] border border-border bg-card px-[15px] text-card-foreground"
                >
                  <p className="text-[9px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    {stat.label}
                  </p>
                  <p className="mt-[18px] text-[38px] font-bold leading-none tracking-[-0.04em]">
                    {stat.value}
                  </p>
                </article>
              ))}
            </section>
          </div>

          <div
            className={`mx-auto flex shrink-0 flex-col items-center px-4 text-[12px] font-semibold tracking-[0.12em] text-[#2f80ed] uppercase transition-all duration-500 ${
              isSecurityExpanded ? "mt-6 py-1" : "mt-8 gap-1 py-2"
            }`}
          >
            <span>Security and fraud detection</span>
            {!isSecurityExpanded && (
              <button
                type="button"
                onClick={() => setIsSecurityExpanded(true)}
                aria-label="Show Security and fraud detection"
                aria-controls="security-fraud"
                aria-expanded="false"
                className="grid size-8 place-items-center rounded-md outline-none transition-colors hover:text-[#1769d2] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <ChevronDown className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      <div
        id="security-fraud"
        aria-hidden={!isSecurityExpanded}
        inert={!isSecurityExpanded}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
          isSecurityExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-10 sm:px-8">
            <div className="mx-auto w-full max-w-5xl pt-4 sm:pt-6">
              <SecurityFraudSection />

              <button
                type="button"
                onClick={() => setIsSecurityExpanded(false)}
                aria-label="Hide Security and fraud detection"
                aria-controls="security-fraud"
                aria-expanded="true"
                className="mx-auto mt-10 grid size-10 place-items-center rounded-md text-[#2f80ed] outline-none transition-colors hover:text-[#1769d2] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <ChevronDown className="size-5 rotate-180" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
