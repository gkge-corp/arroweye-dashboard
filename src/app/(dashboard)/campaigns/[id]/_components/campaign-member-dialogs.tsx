import React from "react";
import {
  CirclePlus,
  LoaderCircle,
  Mail,
  Plus,
  SlidersHorizontal,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { hasAccess } from "@/lib/utils";
import EmailInputWithSuggestions from "@/components/campaigns/EmailInputWithSuggestions";
import { RoleSelect } from "./role-select";
import {
  AddCampaignUserErrors,
  AddCampaignUserFormData,
  CampaignDetailUser,
} from "@/types/campaign-detail";

const memberDialogFieldClassName =
  "!h-11 !rounded-[6px] !border-zinc-300 !bg-white !px-4 !text-[14px] !font-[400] !text-zinc-950 !shadow-none placeholder:!text-zinc-400 focus-visible:!ring-2 focus-visible:!ring-violet-500/25 dark:!border-zinc-600 dark:!bg-zinc-800 dark:!text-zinc-100 dark:placeholder:!text-zinc-400";

interface AddMemberDialogProps {
  open: boolean;
  staffSuggestions: any[];
  formData: AddCampaignUserFormData;
  errors: AddCampaignUserErrors;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleChange: (value: string) => void;
  onAddContactClick: () => void;
  onStaffSelect: (staff: any) => void;
}

export function AddMemberDialog({
  open,
  staffSuggestions,
  formData,
  errors,
  isLoading,
  onOpenChange,
  onSubmit,
  onEmailChange,
  onRoleChange,
  onAddContactClick,
  onStaffSelect,
}: AddMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-[500] uppercase tracking-[.1rem] text-zinc-500 dark:text-zinc-400">
            + Add Members
          </DialogTitle>
          <DialogDescription className="sr-only">
            Add a campaign collaborator by email and role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <p className="text-3xl font-bold text-zinc-950 dark:text-zinc-100">
            Collaborate
          </p>
          <EmailInputWithSuggestions
            staffDetails={staffSuggestions}
            value={formData.email}
            name="email"
            onChange={(event) => {
              const modifiedEvent = {
                ...event,
                target: {
                  ...event.target,
                  name: "email",
                },
              } as React.ChangeEvent<HTMLInputElement>;
              onEmailChange(modifiedEvent);
            }}
            onStaffSelect={onStaffSelect}
            error={errors.email}
            placeholder="Add email"
            required
            inputClassName={memberDialogFieldClassName}
          />

          <Button
            type="button"
            variant="ghost"
            className="h-auto gap-[5px] px-0 py-0 text-[14px] text-zinc-500 hover:bg-transparent hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            onClick={onAddContactClick}
          >
            <CirclePlus />
            <span>Add Contact</span>
          </Button>
          {errors.fullname && (
            <p className="font-SansFlex text-sm text-red-500">
              {errors.fullname}
            </p>
          )}

          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div className="min-w-0">
              <RoleSelect
                value={formData.role}
                onChange={onRoleChange}
                error={errors.role}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-[51px] w-full min-w-0 bg-black px-[12px] py-[15px] text-[14px] text-white hover:bg-orange-500"
            >
              {isLoading ? <LoaderCircle className="animate-spin" /> : <Plus />}
              <span>{isLoading ? "Adding" : "Add"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ContactNameDialogProps {
  open: boolean;
  formData: AddCampaignUserFormData;
  errors: AddCampaignUserErrors;
  onOpenChange: (open: boolean) => void;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ContactNameDialog({
  open,
  formData,
  errors,
  onOpenChange,
  onInputChange,
}: ContactNameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-[500] uppercase tracking-[.1rem] text-zinc-500 dark:text-zinc-400">
            Contact Name
          </DialogTitle>
          <DialogDescription className="sr-only">
            Enter the full name for the new campaign contact.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="text"
            required
            name="fullname"
            label="Enter Full Name"
            value={formData.fullname}
            onChange={onInputChange}
            error={errors.fullname}
            className={memberDialogFieldClassName}
          />
          <DialogFooter className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-full border-zinc-300 px-5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-9 rounded-full bg-zinc-900 px-5 text-sm text-white hover:bg-orange-500 dark:bg-zinc-900 dark:text-white"
              onClick={() => onOpenChange(false)}
              disabled={!formData.fullname}
            >
              Submit
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MemberInfoDialogProps {
  selectedUser: CampaignDetailUser | null;
  userLoggedInProfile: any;
  onOpenChange: (open: boolean) => void;
  onRemoveClick: () => void;
  onAccessClick: () => void;
  onResendInviteClick: () => void;
  isResendingInvite: boolean;
}

export function MemberInfoDialog({
  selectedUser,
  userLoggedInProfile,
  onOpenChange,
  onRemoveClick,
  onAccessClick,
  onResendInviteClick,
  isResendingInvite,
}: MemberInfoDialogProps) {
  return (
    <Dialog
      open={selectedUser !== null}
      onOpenChange={(open) => onOpenChange(open)}
    >
      <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-zinc-200 bg-white p-6 font-SansFlex text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-[400] uppercase tracking-[.1rem] text-[#7c7e81] dark:text-zinc-400">
            Member Information
          </DialogTitle>
          <DialogDescription className="sr-only">
            Campaign member profile and access information.
          </DialogDescription>
        </DialogHeader>

        {selectedUser && (
          <div className="space-y-4">
            <p className="text-[30px] font-[600] text-zinc-900 dark:text-zinc-100">
              {selectedUser.fullname}
            </p>
            <div>
              <p className="text-[16px] font-[400] text-zinc-900 dark:text-zinc-100">
                Email
              </p>
              <p className="text-[16px] font-[600] text-zinc-900 dark:text-zinc-100">
                {selectedUser.staff_email}
              </p>
            </div>
            <div className="text-[16px] font-[400]">
              <p className="text-zinc-900 dark:text-zinc-100">Role</p>
              <p className="font-[600] text-[#01a733] dark:text-green-400">
                {selectedUser.role}
              </p>
            </div>
            <div className="text-[16px] font-[400] text-zinc-900 dark:text-zinc-100">
              <p>Member since</p>
              <p className="font-[600]">{selectedUser.member_since}</p>
            </div>
            <div className="text-[16px] font-[400] text-zinc-900 dark:text-zinc-100">
              <p>Last Login</p>
              <p className="font-[600]">{selectedUser.last_login}</p>
            </div>

            {hasAccess(userLoggedInProfile, ["Manager"]) && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  className="mr-1 rounded bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  onClick={onRemoveClick}
                >
                  <UserMinus />
                  <span className="sr-only">Remove member</span>
                </Button>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  onClick={onAccessClick}
                >
                  <SlidersHorizontal />
                  <span className="sr-only">Adjust member access</span>
                </Button>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="group w-auto gap-0 px-[7px] text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  disabled={isResendingInvite}
                  onClick={onResendInviteClick}
                >
                  {isResendingInvite ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Mail />
                  )}
                  <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:ml-1.5 group-hover:max-w-[120px] group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-[120px] group-focus-visible:opacity-100">
                    Resend invite
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface MemberAccessDialogProps {
  open: boolean;
  role: string | number;
  onOpenChange: (open: boolean) => void;
  onRoleChange: (value: string) => void;
  onSave: () => void;
}

export function MemberAccessDialog({
  open,
  role,
  onOpenChange,
  onRoleChange,
  onSave,
}: MemberAccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-[400] uppercase tracking-[.1rem] text-[#7c7e81] dark:text-zinc-400">
            Member Access
          </DialogTitle>
          <DialogDescription className="sr-only">
            Update this campaign member's role.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 font-SansFlex">
          <RoleSelect value={role} onChange={onRoleChange} />
          <DialogFooter>
            <Button
              type="button"
              className="rounded-full bg-blue-500 px-[16px] py-[8px] text-white hover:bg-blue-600"
              onClick={onSave}
            >
              Save
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel = "Yes",
  cancelLabel = "No",
  confirmVariant = "default",
  onOpenChange,
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  const confirmButtonClassName =
    confirmVariant === "destructive"
      ? "h-9 rounded-full px-5 text-sm font-medium shadow-none active:scale-[0.97]"
      : "h-9 rounded-full bg-zinc-950 px-5 text-sm font-medium !text-white shadow-none hover:bg-zinc-800 hover:!text-white active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-zinc-500/30 dark:bg-zinc-100 dark:!text-zinc-950 dark:hover:bg-zinc-200 dark:hover:!text-zinc-950";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-[500] uppercase tracking-[.16rem] text-zinc-500 dark:text-zinc-400">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[16px] font-[400] text-zinc-950 dark:text-zinc-100">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant={confirmVariant}
            className={confirmButtonClassName}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-zinc-300 dark:border-zinc-600 px-5 text-sm font-medium !text-zinc-950 dark:!text-zinc-100 shadow-none hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:!text-zinc-950 dark:hover:!text-zinc-100 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-violet-500/25"
            onClick={onCancel || (() => onOpenChange(false))}
          >
            {cancelLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
