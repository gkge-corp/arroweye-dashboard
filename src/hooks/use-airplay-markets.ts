"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Which countries the AIRPLAY chart breaks down. Stored per campaign in the
 * browser, the same way the linked song is; swap these two functions when the
 * selection should follow the campaign rather than the device.
 */
const storageKey = (campaignId: string | number) =>
  `airplay-markets:${campaignId}`;

// Switching every market off stops the airplay call, and that same call is
// what lists the countries to pick from. Without a remembered list the picker
// would come up empty, leaving no way back on, so the last known countries are
// kept beside the selection.
const availableKey = (campaignId: string | number) =>
  `airplay-markets-available:${campaignId}`;

const readAvailable = (campaignId: string | number): string[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(availableKey(campaignId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch (error) {
    console.error("Failed to read the remembered airplay markets:", error);
    return [];
  }
};

const writeAvailable = (campaignId: string | number, markets: string[]) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      availableKey(campaignId),
      JSON.stringify(markets),
    );
  } catch (error) {
    console.error("Failed to persist the remembered airplay markets:", error);
  }
};

const readMarkets = (campaignId: string | number): string[] | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey(campaignId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : null;
  } catch (error) {
    console.error("Failed to read the airplay markets:", error);
    return null;
  }
};

const writeMarkets = (
  campaignId: string | number,
  markets: string[] | null,
) => {
  if (typeof window === "undefined") return;

  try {
    if (markets) {
      window.localStorage.setItem(
        storageKey(campaignId),
        JSON.stringify(markets),
      );
    } else {
      window.localStorage.removeItem(storageKey(campaignId));
    }
  } catch (error) {
    console.error("Failed to persist the airplay markets:", error);
  }
};

export interface DerivedAirplayMarkets {
  availableMarkets: string[];
  activeMarkets: string[];
  airplayData: Record<string, number>;
}

export const deriveAirplayMarkets = (
  selected: string[] | null,
  spinsByCountry: Record<string, number> | undefined,
): DerivedAirplayMarkets => {
  const availableMarkets = Object.entries(spinsByCountry ?? {})
    .filter(([, spins]) => spins > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([country]) => country);

  // No stored choice means every market with spins, so the chart is complete
  // until someone narrows it deliberately. A stored market the song no longer
  // charts in would otherwise linger.
  const activeMarkets = selected
    ? selected.filter((country) => availableMarkets.includes(country))
    : availableMarkets;

  const airplayData: Record<string, number> = {};
  let total = 0;

  for (const country of activeMarkets) {
    const spins = spinsByCountry?.[country] ?? 0;
    if (spins <= 0) continue;
    airplayData[country] = spins;
    total += spins;
  }
  airplayData.total_count = total;

  return { availableMarkets, activeMarkets, airplayData };
};

export function useAirplayMarkets(campaignId: string | number | undefined) {
  const [selected, setSelected] = useState<string[] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [knownMarkets, setKnownMarkets] = useState<string[]>([]);

  useEffect(() => {
    if (campaignId === undefined) return;
    setSelected(readMarkets(campaignId));
    setKnownMarkets(readAvailable(campaignId));
    setIsLoaded(true);
  }, [campaignId]);

  /** Remember the countries the last live response listed. */
  const rememberMarkets = useCallback(
    (markets: string[]) => {
      if (campaignId === undefined || markets.length === 0) return;
      setKnownMarkets((current) =>
        current.length === markets.length &&
        current.every((market, index) => market === markets[index])
          ? current
          : markets,
      );
      writeAvailable(campaignId, markets);
    },
    [campaignId],
  );

  const setMarkets = useCallback(
    (markets: string[] | null) => {
      if (campaignId === undefined) return;
      writeMarkets(campaignId, markets);
      setSelected(markets);
    },
    [campaignId],
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
