"use client";

import type { AppUser } from "@/types/api";
import { hasAccess } from "@/lib/utils";
import { useCampaignMemberActions } from "@/hooks/use-campaign-member-actions";
import { CampaignMembersList } from "./campaign-members-list";
import {
  AddMemberDialog,
  ConfirmActionDialog,
  ContactNameDialog,
  MemberAccessDialog,
  MemberInfoDialog,
} from "./campaign-member-dialogs";

interface CampaignMembersSectionProps {
  id: string;
  content: any;
  refreshContent: () => void;
  members: AppUser[] | null;
  staffSuggestions: any[];
  userLoggedInProfile: any;
}

export function CampaignMembersSection({
  id,
  content,
  refreshContent,
  members,
  staffSuggestions,
  userLoggedInProfile,
}: CampaignMembersSectionProps) {
  const {
    visible,
    setVisible,
    nameDialogVisible,
    setNameDialogVisible,
    selectedUser,
    setSelectedUser,
    adjustmentModalVisible,
    setAdjustmentModalVisible,
    deleteModal,
    setDeleteModal,
    isAddUserLoading,
    addUserFormData,
    addUserErrors,
    setUseWatchersEndpoint,
    handleAddUserInputChange,
    handleAddUserRoleChange,
    handleAddUserSubmit,
    handleCampaignActionRemove,
    handleCampaignActionUpdate,
    handleUserClick,
    handleStaffSelect,
  } = useCampaignMemberActions({ id, content, refreshContent });

  return (
    <>
      <CampaignMembersList
        members={members}
        canAddMember={hasAccess(userLoggedInProfile, ["Manager"])}
        onAddMemberClick={() => setVisible(true)}
        onUserClick={handleUserClick}
      />

      <AddMemberDialog
        open={visible}
        staffSuggestions={staffSuggestions}
        formData={addUserFormData}
        errors={addUserErrors}
        isLoading={isAddUserLoading}
        onOpenChange={setVisible}
        onSubmit={handleAddUserSubmit}
        onEmailChange={(event) => {
          setUseWatchersEndpoint(false);
          handleAddUserInputChange(event);
        }}
        onRoleChange={handleAddUserRoleChange}
        onAddContactClick={() => setNameDialogVisible(true)}
        onStaffSelect={handleStaffSelect}
      />

      <ContactNameDialog
        open={nameDialogVisible}
        formData={addUserFormData}
        errors={addUserErrors}
        onOpenChange={setNameDialogVisible}
        onInputChange={handleAddUserInputChange}
      />

      <MemberInfoDialog
        selectedUser={selectedUser}
        userLoggedInProfile={userLoggedInProfile}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        onRemoveClick={() => setDeleteModal(true)}
        onAccessClick={() => setAdjustmentModalVisible(true)}
      />

      <MemberAccessDialog
        open={adjustmentModalVisible}
        role={addUserFormData.role}
        onOpenChange={setAdjustmentModalVisible}
        onRoleChange={handleAddUserRoleChange}
        onSave={handleCampaignActionUpdate}
      />

      <ConfirmActionDialog
        open={deleteModal}
        title="Remove member"
        description="Are you sure you want to remove this profile from this project?"
        confirmLabel="OK"
        cancelLabel="Cancel"
        onOpenChange={setDeleteModal}
        onConfirm={handleCampaignActionRemove}
      />
    </>
  );
}
