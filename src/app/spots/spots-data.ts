// Neither analytics provider ranks TV channels or publications, so these
// lists are maintained by hand (copied from the original Spots site).

export interface TvChannel {
  name: string;
  country: string;
  audience: number;
}

export interface Publication {
  name: string;
  country: string;
  seoScore: number;
  audience: number;
  /** 1–10, shown as Low / Mid / High */
  engagement: number;
  topPlatform: string;
  website: string;
  social: string;
}

export const TV_CHANNELS: TvChannel[] = [
  { name: "MTV Base", country: "Nigeria", audience: 15_200_000 },
  { name: "Trace TV", country: "Nigeria", audience: 12_500_000 },
  { name: "Soundcity TV", country: "Nigeria", audience: 9_800_000 },
  { name: "Pop Central", country: "Nigeria", audience: 8_300_000 },
  { name: "On Max", country: "Nigeria", audience: 7_900_000 },
  { name: "On TV", country: "Nigeria", audience: 6_700_000 },
  { name: "Silverbird TV", country: "Nigeria", audience: 5_800_000 },
  { name: "Urban TV", country: "Nigeria", audience: 4_900_000 },
  { name: "Hip TV", country: "Nigeria", audience: 4_500_000 },
  { name: "Spice TV", country: "Nigeria", audience: 3_900_000 },
];

export const PUBLICATIONS: Publication[] = [
  {
    name: "Culture Custodian",
    country: "Nigeria",
    seoScore: 72,
    audience: 452_000,
    engagement: 4,
    topPlatform: "Instagram",
    website: "https://culturecustodian.com/",
    social: "https://www.instagram.com/culturecustodian",
  },
  {
    name: "Native Magazine",
    country: "UK/Nigeria",
    seoScore: 61,
    audience: 242_000,
    engagement: 6,
    topPlatform: "Twitter",
    website: "https://thenativemag.com/",
    social: "https://twitter.com/NativeMag",
  },
  {
    name: "NotJustOk",
    country: "Nigeria",
    seoScore: 85,
    audience: 4_000_000,
    engagement: 7,
    topPlatform: "Instagram",
    website: "https://notjustok.com/",
    social: "https://www.instagram.com/notjustok",
  },
  {
    name: "Legit",
    country: "Nigeria",
    seoScore: 70,
    audience: 10_000_000,
    engagement: 9,
    topPlatform: "Facebook",
    website: "https://www.legit.ng/",
    social: "https://www.facebook.com/legitngnews/",
  },
  {
    name: "Pulse",
    country: "Nigeria",
    seoScore: 73,
    audience: 15_000_000,
    engagement: 10,
    topPlatform: "Instagram",
    website: "https://www.pulse.ng/",
    social: "https://www.instagram.com/pulsenigeria247",
  },
  {
    name: "Notesphere",
    country: "Nigeria",
    seoScore: 67,
    audience: 60_000,
    engagement: 6,
    topPlatform: "Twitter",
    website: "https://thenotesphere.com/",
    social: "https://twitter.com/notesphere",
  },
  {
    name: "49th Street",
    country: "Nigeria",
    seoScore: 75,
    audience: 126_000,
    engagement: 4,
    topPlatform: "Twitter",
    website: "https://the49thstreet.com/",
    social: "https://twitter.com/the49thstreet",
  },
  {
    name: "BellaNaija",
    country: "Nigeria",
    seoScore: 92,
    audience: 6_000_000,
    engagement: 6,
    topPlatform: "Instagram",
    website: "https://www.bellanaija.com/",
    social: "https://www.instagram.com/bellanaijaonline",
  },
  {
    name: "Instablog9ja",
    country: "Nigeria",
    seoScore: 67,
    audience: 14_000_000,
    engagement: 5,
    topPlatform: "Instagram",
    website: "http://instablog9ja.com/",
    social: "https://www.instagram.com/instablog9ja",
  },
  {
    name: "Tunde Ednut",
    country: "Nigeria",
    seoScore: 0,
    audience: 4_300_000,
    engagement: 9,
    topPlatform: "Instagram",
    website: "https://www.instagram.com/mazitundeednut",
    social: "https://www.instagram.com/mazitundeednut",
  },
  {
    name: "OkayAfrica",
    country: "US",
    seoScore: 100,
    audience: 2_000_000,
    engagement: 6,
    topPlatform: "Website",
    website: "https://www.okayafrica.com/",
    social: "https://www.okayafrica.com/",
  },
  {
    name: "Viper",
    country: "UK/US",
    seoScore: 58,
    audience: 16_000,
    engagement: 4,
    topPlatform: "Instagram",
    website: "https://www.vipermag.com/",
    social: "https://www.instagram.com/vipermagazine/",
  },
  {
    name: "Tooxclusive",
    country: "Nigeria",
    seoScore: 92,
    audience: 2_000_000,
    engagement: 5,
    topPlatform: "Facebook",
    website: "https://tooxclusive.com/",
    social: "https://www.facebook.com/tooxclusive",
  },
  {
    name: "Marmalade",
    country: "UK",
    seoScore: 71,
    audience: 4_000,
    engagement: 5,
    topPlatform: "Website",
    website: "https://www.marmaladecollective.com/",
    social: "https://www.marmaladecollective.com/",
  },
  {
    name: "Deeds Magazine",
    country: "Nigeria",
    seoScore: 65,
    audience: 27_000,
    engagement: 5,
    topPlatform: "Website",
    website: "https://www.deedsmag.com/",
    social: "https://www.deedsmag.com/",
  },
  {
    name: "Rolling Stone Africa",
    country: "Nigeria",
    seoScore: 49,
    audience: 12_000,
    engagement: 5,
    topPlatform: "Instagram",
    website: "http://rollingstoneafrica.com/",
    social: "https://www.instagram.com/rollingstoneafrica",
  },
  {
    name: "WeTalkSound",
    country: "Nigeria",
    seoScore: 67,
    audience: 244_000,
    engagement: 5,
    topPlatform: "TikTok",
    website: "https://wetalksound.co/blog",
    social: "https://www.tiktok.com/@wetalksound",
  },
  {
    name: "iMullar",
    country: "Ghana",
    seoScore: 65,
    audience: 78_000,
    engagement: 5,
    topPlatform: "Instagram",
    website: "https://imullar.com/",
    social: "https://www.instagram.com/theimullar",
  },
];
