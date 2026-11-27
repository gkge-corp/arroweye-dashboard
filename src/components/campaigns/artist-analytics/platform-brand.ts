import type { IconType } from "react-icons";
import { FaDeezer } from "react-icons/fa6";
import {
  SiApplemusic,
  SiFacebook,
  SiInstagram,
  SiSoundcloud,
  SiSpotify,
  SiTiktok,
  SiX,
  SiYoutube,
} from "react-icons/si";

export const PLATFORM_COLORS: Record<string, string> = {
  spotify: "#1db954",
  instagram: "#e1306c",
  tiktok: "#00b2c2",
  youtube: "#ff0000",
  facebook: "#1877f2",
  twitter: "#71717a",
  deezer: "#a238ff",
  soundcloud: "#ff7700",
};

export const PLATFORM_ICONS: Record<string, IconType> = {
  "apple-music": SiApplemusic,
  spotify: SiSpotify,
  instagram: SiInstagram,
  tiktok: SiTiktok,
  youtube: SiYoutube,
  facebook: SiFacebook,
  twitter: SiX,
  deezer: FaDeezer,
  soundcloud: SiSoundcloud,
};
