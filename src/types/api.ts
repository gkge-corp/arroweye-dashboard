import type { components, operations } from "@/types/generated/arroweye-api";

/**
 * Stable names for generated OpenAPI schemas.
 *
 * Keep UI code importing from this file. The generated file is intentionally
 * large and should only be refreshed from docs/Arroweye API.yaml.
 */
export type OrganizationKind = "agency" | "label" | "personal";
export type Business = components["schemas"]["Business"] & {
  kind?: OrganizationKind;
};
export type BusinessStaff = components["schemas"]["Staff"];
export type Campaign = components["schemas"]["MarketplaceCampaign"];
export type CampaignDraft = components["schemas"]["MarketplaceCampaignDraft"];
export type CampaignDraftResponse = CampaignDraft & {
  /** Returned at runtime but missing from the documented response schema. */
  id?: number;
};
export type EventStatus = "confirmed" | "tentative" | "cancelled";
/** description/status are returned at runtime but not yet in the documented schema. */
type EventDetailFields = {
  description?: string | null;
  status?: EventStatus;
};
export type CreateEventInput = components["schemas"]["CreateEvent"] &
  EventDetailFields;
export type CreateInvoiceInput = components["schemas"]["CreateInvoice"] & {
  isrc?: string;
};
export type CreateServiceInput = Omit<components["schemas"]["Service"], "id">;
export type Event = components["schemas"]["Event"] & EventDetailFields;
export type UpdateEventInput = components["schemas"]["PatchedEvent"] &
  EventDetailFields;
export type Project = components["schemas"]["Project"];
export type ProjectListItem = components["schemas"]["ProjectList"];
export type RescheduleEventInput = components["schemas"]["RescheduleEvent"];
export type UpdateProjectInput = components["schemas"]["PatchedProject"] & {
  isrc?: string | null;
};

export interface CampaignOptionItem {
  id: number;
  title: string;
  code?: string;
  pin?: string;
  vendor?: { id: number } | null;
  subvendor?: { id: number } | null;
}

export type CampaignPage =
  operations["api_v1_campaigns_list"]["responses"][200]["content"]["application/json"];

export type DropZonePage =
  operations["api_v1_projects_general_dropzone_list"]["responses"][200]["content"]["application/json"];

export type NotificationPage =
  operations["api_v1_notification_notification_list"]["responses"][200]["content"]["application/json"];

export type LoginRequest = { email: string };
export type VerifyLoginRequest = { email: string; token: string };

export interface LoginResponse {
  message?: string;
  errorResponse?: unknown;
}

export type RescheduleEventResponse = RescheduleEventInput & {
  invoice_created?: boolean;
};

/**
 * drf-spectacular currently describes serializer method fields such as
 * user_profile as strings. These are the runtime shapes consumed by this app.
 * Remove these overrides when the backend schema is corrected.
 */
export interface UserProfile {
  id?: string | number;
  fullname: string;
  staff_email: string;
  role: string;
  business_name: string;
  business_type: string;
}

export interface UserOrganization {
  id: number;
  name: string | null;
  kind: "agency" | "label";
  role: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  user_type?: components["schemas"]["UserTypeEnum"];
  platform_role?: string | null;
  organizations?: UserOrganization[];
  user_profile: UserProfile;
  created: string | null;
  last_login?: string | null;
  phone_verified?: boolean;
  notifications?: components["schemas"]["Notification"][];
  claimed_rewards?: unknown[];
}

export interface AuthSession {
  access?: string;
  refresh?: string;
  token?: string;
  user: AuthenticatedUser;
}

type DocumentedLeanUser = components["schemas"]["LeanUser"];

export type AppUser = Omit<DocumentedLeanUser, "user_profile"> & {
  user_profile: UserProfile;
};

export type AppProject = Omit<Project, "watchers"> & {
  watchers: AppUser[];
  /** Returned and accepted at runtime but missing from the documented schema. */
  isrc?: string | null;
};

type DocumentedDropZone = components["schemas"]["DropZone"];

export type DropZone = Omit<
  DocumentedDropZone,
  "first_name" | "last_name" | "link" | "user"
> & {
  first_name?: string | null;
  last_name?: string | null;
  link?: string | null;
  project_pin?: string;
  project_title?: string;
  user: AppUser;
};

export type AppDropZonePage = Omit<DropZonePage, "results"> & {
  results: DropZone[];
};

export type AddStaffInput = components["schemas"]["AddStaff"];

export interface ProjectWatcherAction {
  action: "addition" | "remove" | "update";
  user_id?: string | null;
  role?: string | number;
}

export interface Artist {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  countries: string[];
  verified: boolean;
}

export interface ArtistPage {
  count: number;
  page: number;
  pages: number;
  results: Artist[];
}

export interface ArtistStat {
  code: string;
  label: string;
  value: number;
  trend: number[];
}

export interface ArtistProfile {
  avatar: string | null;
  country: string;
  bio: string | null;
  genres: string[];
  links: { code: string; label: string; url: string }[];
  markets: { primary: string | null; secondary: string | null };
  stats: ArtistStat[];
  latestRelease: {
    title: string;
    image: string | null;
    releaseDate: string;
    artists: string;
  } | null;
  collaborators: string[];
  topTracks: { id: string; title: string; artists: string; image: string | null }[];
}

export interface ArtistPageData extends Artist {
  profile: ArtistProfile | null;
}
