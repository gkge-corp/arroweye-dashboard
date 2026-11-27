"use client";

import { useCallback } from "react";

import { useReportSettings } from "@/hooks/use-report-settings";

/**
 * Which countries the AIRPLAY chart breaks down, saved per campaign so the
 * weekly report charts the same markets as the page.
 */

export {
  deriveAirplayMarkets,
  type DerivedAirplayMarkets,
} from "@/lib/music-analytics/airplay-markets";

// Shared so the fallback keeps one identity across renders.
const NO_MARKETS: string[] = [];

const sameMarkets = (a: string[], b: string[]) =>
  a.length === b.length && a.every((market, index) => market === b[index]);

export function useAirplayMarkets(campaignId: string | number | undefined) {
  const { settings, isLoaded, saveSettings } = useReportSettings(campaignId);
  const selected = settings?.airplay_markets ?? null;
  // Switching every market off stops the airplay call, and that same call is
  // what lists the countries to pick from, so the last known list is kept.
  const knownMarkets = settings?.known_airplay_markets ?? NO_MARKETS;

  /** Remember the countries the last live response listed. */
  const rememberMarkets = useCallback(
    (markets: string[]) => {
      if (markets.length === 0 || sameMarkets(markets, knownMarkets)) return;
      saveSettings({ known_airplay_markets: markets });
    },
    [knownMarkets, saveSettings],
  );

  const setMarkets = useCallback(
    (markets: string[] | null) => saveSettings({ airplay_markets: markets }),
    [saveSettings],
  );

  // An explicit empty selection is a deliberate "do not fetch airplay".
  const airplayDisabled = selected !== null && selected.length === 0;

  return {
    selected,
    isLoaded,
    airplayDisabled,
    knownMarkets,
    rememberMarkets,
    setMarkets,
  };
}
