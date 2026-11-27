import type { Metadata } from "next";
import ArtistPageClient from "./artist-page-client";

export const metadata: Metadata = {
  title: "Artist - Arroweye",
  description: "Artiste profile, audience and releases.",
};

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArtistPageClient slug={slug} />;
}
