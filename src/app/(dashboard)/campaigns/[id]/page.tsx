"use client";

import React from "react";
import { useParams } from "next/navigation";
import { hasAccess } from "@/lib/utils";
import NoNetwork from "@/components/no-network";
import ScheduleProject from "@/components/campaigns/schedule/component/ScheduleProject";
import CampaignInsightAdvertiser from "@/components/campaigns/CampaignInsightAdvertiser";
import CampaignInsights from "@/components/campaigns/campaign-insights";
import { InsightChartSkeleton } from "@/components/campaigns/InsightChartSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaignDetail } from "@/hooks/use-campaign-detail";
import { useCampaignEditMode } from "@/hooks/use-campaign-edit-mode";
import { useCampaignExports } from "@/hooks/use-campaign-exports";
import { useCampaignMemberActions } from "@/hooks/use-campaign-member-actions";
import { CampaignDetailsHeader } from "./_components/campaign-details-header";
import {
  AddMemberDialog,
  ConfirmActionDialog,
  ContactNameDialog,
  MemberAccessDialog,
  MemberInfoDialog,
} from "./_components/campaign-member-dialogs";
import DropsList from "@/components/campaigns/DropsList";

const predefinedColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-indigo-500",
  "bg-gray-500",
];

const CampaignDetailSkeleton = () => (
  <div className="relative mx-auto w-full max-w-7xl space-y-8 pb-20">
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-6 w-24 rounded-none" />
      </div>
      <Skeleton className="h-12 w-[420px] max-w-full" />
      <div className="flex items-center justify-between gap-5">
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="size-[50px] rounded-full" />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-14 rounded-full" />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-x-[10px] gap-y-[20px] md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="w-full space-y-[20px] rounded-[8px] border p-[20px]"
        >
          <div className="border-b pb-[20px]">
            <InsightChartSkeleton showFilter={index === 0} />
          </div>
          <div className="border-b pb-[20px]">
            <InsightChartSkeleton chartVariant={index === 2 ? "bar" : "pie"} />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-[120px] w-full rounded-[8px]" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ProjectDetails = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const {
    content,
    setContent,
    subvendorStaff,
    staffSuggestions,
    userLoggedInProfile,
    isAdvertiser,
    isContentFetching,
    hasNetworkError,
    refreshContent,
  } = useCampaignDetail(id);
  const {
    toggleNotifications,
    editModeOff,
    showIcons,
    setEditModeOff,
    setShowIcons,
    requestEditModeChange,
    confirmEditModeOff,
    cancelEditModeOff,
  } = useCampaignEditMode();
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
  } = useCampaignMemberActions({
    id,
    content,
    refreshContent,
  });
  const { handleDownloadPDF, handleExportCSV } = useCampaignExports(content);

  const originalTitle = content?.title || "";
  const campaignTitle =
    content?.title || content?.song_title || content?.campaign?.song_title;
  const isSubvendorAgent =
    userLoggedInProfile?.business_type === "SubVendor" &&
    userLoggedInProfile?.role === "Agent";

  React.useEffect(() => {
    if (campaignTitle) {
      document.title = `${campaignTitle} - Arroweye`;
    }
  }, [campaignTitle]);

  if (!content && isContentFetching) {
    return <CampaignDetailSkeleton />;
  }

  return (
    <>
      {hasNetworkError ? (
        <NoNetwork onReconnect={refreshContent} />
      ) : (
        <div
          id="pdf-content"
          className="relative mx-auto w-full max-w-7xl"
          style={{ marginBottom: "80px" }}
        >
          <CampaignDetailsHeader
            content={content}
            setContent={setContent}
            subvendorStaff={subvendorStaff}
            predefinedColors={predefinedColors}
            userLoggedInProfile={userLoggedInProfile}
            isAdvertiser={isAdvertiser}
            toggleNotifications={toggleNotifications}
            showIcons={showIcons}
            originalTitle={originalTitle}
            onShowIconsChange={setShowIcons}
            onAddMemberClick={() => setVisible(true)}
            onUserClick={handleUserClick}
            onRequestEditModeChange={requestEditModeChange}
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

          {hasAccess(userLoggedInProfile, ["Manager", "Supervisor"]) && (
            <>
              <CampaignInsights
                editMode={toggleNotifications}
                handleDownloadPage={handleDownloadPDF}
                handleDownloadData={handleExportCSV}
                isAdvertiser={isAdvertiser}
                content={content}
                refreshContent={refreshContent}
                onRequestEditModeChange={requestEditModeChange}
              />
              {/* <ScheduleProject
                filterIcon={false}
                isDateClickEnabled={false}
                isProjectPage={true}
              /> */}
            </>
          )}

          {isAdvertiser && <CampaignInsightAdvertiser content={content} />}
          {isSubvendorAgent && (
            <div className="mb-[100px]">
              <DropsList
                isAdvertiser={isAdvertiser}
                content={content}
                onAssetsChanged={refreshContent}
              />
            </div>
          )}

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

          <ConfirmActionDialog
            open={editModeOff}
            title="Disable edit mode"
            description="Make sure all your changes are saved before you proceed. Please note that any unsaved changes will be lost permanently."
            onOpenChange={setEditModeOff}
            onConfirm={confirmEditModeOff}
            onCancel={cancelEditModeOff}
          />
        </div>
      )}
    </>
  );
};

export default ProjectDetails;
