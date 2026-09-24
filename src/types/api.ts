import type { components, operations } from "@/types/generated/arroweye-api";

/**
 * Stable names for generated OpenAPI schemas.
 *
 * Keep UI code importing from this file. The generated file is intentionally
 * large and should only be refreshed from docs/Arroweye API.yaml.
 */
export type Business = components["schemas"]["Business"];
export type BusinessStaff = components["schemas"]["Staff"];
export type Campaign = components["schemas"]["MarketplaceCampaign"];
export type CampaignDraft = components["schemas"]["MarketplaceCampaignDraft"];
export type CampaignDraftResponse = CampaignDraft & {
  /** Returned at runtime but missing from the documented response schema. */
  id?: number;
};
export type CreateBusinessInput = components["schemas"]["CreateBusiness"];
export type CreateEventInput = components["schemas"]["CreateEvent"];
export type Event = components["schemas"]["Event"];
export type Project = components["schemas"]["Project"];
export type ProjectListItem = components["schemas"]["ProjectList"];
export type RescheduleEventInput = components["schemas"]["RescheduleEvent"];
export type UpdateProjectInput = components["schemas"]["PatchedProject"] & {
  isrc?: string | null;
};

export type CampaignPage =
  operations["api_v1_campaigns_list"]["responses"][200]["content"]["application/json"];

export type DropZonePage =
  operations["api_v1_projects_general_dropzone_list"]["responses"][200]["content"]["application/json"];

export type NotificationPage =
  operations["api_v1_notification_notification_list"]["responses"][200]["content"]["application/json"];

export type LoginRequest = { email: string };
export type VerifyLoginRequest = { token: string };

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

export interface AuthenticatedUser {
  id: string;
  email: string;
  user_type?: components["schemas"]["UserTypeEnum"];
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
