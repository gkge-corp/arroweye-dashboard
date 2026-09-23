const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

/** ISO 3166 alpha-2 code -> English country name, falling back to the code. */
export const readCountryName = (code?: string | null) => {
  if (!code) return "";
  try {
    return countryNames.of(code.toUpperCase()) ?? code;
  } catch (error) {
    console.error(`Unknown country code "${code}":`, error);
    return code;
  }
};
