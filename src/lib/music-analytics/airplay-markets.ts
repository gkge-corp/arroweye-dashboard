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
