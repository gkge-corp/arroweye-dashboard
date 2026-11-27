import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

const BRAND_DESCRIPTION =
  "Track expenses, generate reports and leverage key insights to boost your ROI.";
  const OG_IMAGE = "https://studio.arroweye.pro/banner.png";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

interface CampaignTitleResponse {
  title?: string | null;
  song_title?: string | null;
}

const getCampaignTitle = async (
  endpoint: string,
  token: string,
): Promise<string | null> => {
  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const campaign = (await response.json()) as CampaignTitleResponse;
    return (
      campaign.title?.trim() ||
      campaign.song_title?.trim() ||
      null
    );
  } catch {
    return null;
  }
};

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const token = (await cookies()).get("auth_token")?.value;
  const apiBaseUrl = process.env.NEXT_PUBLIC_APP_SERVER_DOMAIN?.replace(
    /\/$/,
    "",
  );
  let campaignTitle: string | null = null;

  if (token && apiBaseUrl) {
    campaignTitle = await getCampaignTitle(
      `${apiBaseUrl}/api/campaigns/${id}`,
      token,
    );
  }

  const title = campaignTitle
    ? `${campaignTitle} - Arroweye`
    : "Campaign - Arroweye";
  const url = `https://studio.arroweye.pro/campaigns/${id}`;

  return {
    title,
    description: BRAND_DESCRIPTION,
    openGraph: {
      type: "website",
      url,
      title,
      description: BRAND_DESCRIPTION,
      images: [{ url: OG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: BRAND_DESCRIPTION,
      images: [OG_IMAGE],
    },
  };
}

const CampaignDetailLayout = ({ children }: LayoutProps) => {
  return children;
};

export default CampaignDetailLayout;
