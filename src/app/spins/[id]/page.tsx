"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getSpinsNotificationPublic } from "@/services";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { mdiMapMarker } from "@mdi/js";
import Icon from "@mdi/react";
import type { StyleSpecification } from "maplibre-gl";
import { Map, MapControls, MapPopup } from "@/components/ui/map";

const SPIN_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    openStreetMap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "open-street-map",
      type: "raster",
      source: "openStreetMap",
      minzoom: 0,
      maxzoom: 19,
      paint: {
        "raster-brightness-max": 0.55,
        "raster-contrast": 0.15,
        "raster-saturation": -0.7,
      },
    },
  ],
};

const SPIN_MAP_STYLES = {
  light: SPIN_MAP_STYLE,
  dark: SPIN_MAP_STYLE,
};

type SpinNotificationResponse = {
  result?: {
    metadata?: {
      music?: { title?: string }[];
      timestamp_utc?: string;
    };
  };
  session?: {
    location?: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
    dj?: {
      first_name?: string;
      last_name?: string;
    };
  };
};

const SpinsNotification = () => {
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = useState<{
    content: string;
    timeAgo: string;
    location: string;
    coordinates: [number, number] | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    getSpinsNotificationPublic(id)
      .then((fetchedContent: SpinNotificationResponse | null) => {
        const music = fetchedContent?.result?.metadata?.music?.[0];
        const session = fetchedContent?.session;
        const dj = session?.dj;

        if (!music || !dj) {
          console.warn("Missing music or DJ data in response");
          return;
        }

        const trackTitle = music.title || "this track";
        const djName =
          [dj.first_name, dj.last_name].filter(Boolean).join(" ") || "a DJ";
        const location = session.location;
        const timestamp = fetchedContent?.result?.metadata?.timestamp_utc;
        const latitude =
          session.latitude == null ? Number.NaN : Number(session.latitude);
        const longitude =
          session.longitude == null ? Number.NaN : Number(session.longitude);
        const hasCoordinates =
          Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180;

        setNotification({
          content: `Great news! ${trackTitle} was just played by ${djName}${location ? ` at ${location}` : ""}`,
          timeAgo: timestamp
            ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
            : "",
          location: location || "Location unavailable",
          coordinates: hasCoordinates ? [longitude, latitude] : null,
        });
      })
      .catch((err) => {
        console.error("Error fetching spins notification:", err);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 text-sm text-gray-600">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
        Loading spin location…
      </div>
    );
  }

  if (!notification?.coordinates) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
          <Icon
            path={mdiMapMarker}
            size={0.9}
            className="text-gray-500"
            aria-hidden="true"
          />
        </span>
        <h1 className="mt-4 text-lg font-bold text-gray-950">
          Spin location unavailable
        </h1>
        <p className="mt-1 max-w-md text-sm leading-6 text-gray-600">
          This spin does not include valid latitude and longitude coordinates.
        </p>
      </div>
    );
  }

  const [longitude, latitude] = notification.coordinates;

  return (
    <main className="relative h-screen min-h-[560px] w-full overflow-hidden bg-[#0b0b0b]">
      <Map
        center={[longitude, latitude]}
        zoom={14}
        minZoom={2}
        maxZoom={19}
        theme="dark"
        styles={SPIN_MAP_STYLES}
      >
        <MapControls showFullscreen />

        <MapPopup
          longitude={longitude}
          latitude={latitude}
          closeOnClick={false}
          closeOnMove={false}
          focusAfterOpen={false}
          anchor="bottom"
          offset={24}
          className="w-[min(338px,calc(100vw-2rem))] overflow-hidden rounded-2xl border-0 bg-[#252525] p-0 text-white shadow-2xl"
        >
          <div
            className="flex h-28 items-center justify-center bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url(/Notificationheader.png)" }}
          >
            <Image
              src="/spinslogomodal.svg"
              alt="Arroweye Spins"
              width={66}
              height={66}
              priority
            />
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              <Image src="/albumicon.svg" alt="" width={24} height={24} />
              <p className="text-xs text-[#B0B0B0]">{notification.timeAgo}</p>
            </div>
            <p className="mt-3 leading-6 text-white">{notification.content}</p>
            <div className="mt-4 flex items-start gap-2 border-t border-white/10 pt-3 text-xs text-[#B0B0B0]">
              <Icon
                path={mdiMapMarker}
                size={0.65}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>{notification.location}</span>
            </div>
          </div>
        </MapPopup>
      </Map>

      <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-center rounded-xl bg-black p-2 shadow-md backdrop-blur-md">
        <Image
          src="/spinslogomodal.svg"
          alt="Arroweye Spins"
          width={34}
          height={34}
        />
      </div>
    </main>
  );
};

export default SpinsNotification;
