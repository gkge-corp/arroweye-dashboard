import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";
import { AddStaff, campaignStaffAction } from "@/services";
import { sendCampaignWelcome } from "@/actions/campaign-welcome";
import {
  AddCampaignUserErrors,
  AddCampaignUserFormData,
  CampaignDetailUser,
} from "@/types/campaign-detail";

const emptyAddUserErrors: AddCampaignUserErrors = {
  email: "",
  business_id: "",
  role: "",
  fullname: "",
};

interface UseCampaignMemberActionsProps {
  id?: string;
  content: any;
  refreshContent: () => void;
}

export function useCampaignMemberActions({
  id,
  content,
  refreshContent,
}: UseCampaignMemberActionsProps) {
  const [visible, setVisible] = useState(false);
  const [nameDialogVisible, setNameDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CampaignDetailUser | null>(
    null,
  );
  const [useWatchersEndpoint, setUseWatchersEndpoint] = useState(false);
  const [selectedWatcher, setSelectedWatcher] = useState<any>(null);
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isAddUserLoading, setIsAddUserLoading] = useState(false);
  const [addUserFormData, setAddUserFormData] =
    useState<AddCampaignUserFormData>({
      email: "",
      business_id: "",
      role: "",
      fullname: "",
      project_id: id,
    });
  const [addUserErrors, setAddUserErrors] =
    useState<AddCampaignUserErrors>(emptyAddUserErrors);

  const resetAddUserForm = () => {
    setAddUserFormData({
      email: "",
      business_id: "",
      role: "",
      fullname: "",
      project_id: id,
    });
  };

  const sendWelcomeEmail = async (recipient: string) => {
    if (!id || !recipient) return;

    try {
      const result = await sendCampaignWelcome({ campaignId: id, recipient });
      if (result.success) return;
      console.error("Welcome email failed:", result.message);
    } catch (error) {
      console.error("Welcome email failed:", error);
    }
    toast.warning("Member added, but the welcome email could not be sent.");
  };

  const handleAddUserInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = event.target;
    setAddUserFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddUserRoleChange = (value: string | number) => {
    setAddUserFormData((prevData) => ({
      ...prevData,
      role: value,
    }));
  };

  const handleAddUserSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsAddUserLoading(true);

    const newAddUserErrors = { ...emptyAddUserErrors };

    if (
      !addUserFormData.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addUserFormData.email)
    ) {
      newAddUserErrors.email = "Please enter a valid email address.";
    }
    if (!addUserFormData.role) {
      newAddUserErrors.role = "Role is required.";
    }
    if (!addUserFormData.fullname) {
      newAddUserErrors.fullname = "Full name is required.";
    }

    const hasErrors = Object.values(newAddUserErrors).some(Boolean);

    if (hasErrors || !id) {
      setAddUserErrors(newAddUserErrors);
      setIsAddUserLoading(false);
      return;
    }

    if (useWatchersEndpoint) {
      const payload = {
        action: "addition" as const,
        user_id: selectedWatcher?.user,
      };

      const recipient = selectedWatcher?.staff_email || addUserFormData.email;

      campaignStaffAction(Number(id), payload)
        .then((response) => {
          if (response) {
            void sendWelcomeEmail(recipient);
            refreshContent();
            setVisible(false);
            setNameDialogVisible(false);
            resetAddUserForm();
            setSelectedUser(null);
            toast.success("Adding Staff successful! Redirecting...");
          }
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {
          setIsAddUserLoading(false);
        });
      return;
    }

    const payload = {
      ...addUserFormData,
      business_id: Number(content?.subvendor?.id),
      role: String(addUserFormData.role),
      project_id: Number(id),
    };

    AddStaff(payload)
      .then(() => {
        void sendWelcomeEmail(payload.email);
        setVisible(false);
        setNameDialogVisible(false);
        resetAddUserForm();
        refreshContent();
      })
      .catch((err) => {
        if (err.response) {
          const serverErrors = err.response.data;
          setAddUserErrors((prev) => ({
            ...prev,
            email: serverErrors?.email || prev.email,
            role: serverErrors?.role || prev.role,
            fullname: serverErrors?.fullname || prev.fullname,
          }));
        } else {
          console.error(err.request || err.message);
        }
      })
      .finally(() => {
        setIsAddUserLoading(false);
      });
  };

  const handleCampaignActionRemove = () => {
    if (!id) return;

    const payload = {
      action: "remove" as const,
      user_id: selectedUser?.id,
    };

    campaignStaffAction(Number(id), payload)
      .then(() => {
        refreshContent();
        setDeleteModal(false);
        setSelectedUser(null);
        toast.success("User removed successfully!");
      })
      .catch((error) => console.log(error));
  };

  const handleCampaignActionUpdate = () => {
    if (!id) return;

    const payload = {
      action: "update" as const,
      user_id: selectedUser?.id,
      role: addUserFormData.role,
    };

    campaignStaffAction(Number(id), payload)
      .then(() => {
        refreshContent();
        setAdjustmentModalVisible(false);
        setSelectedUser(null);
        toast.success("User role updated successfully!");
        resetAddUserForm();
      })
      .catch((error) => console.log(error));
  };

  const handleUserClick = (user: any) => {
    const mappedUser: CampaignDetailUser = {
      id: user.id,
      initials: user.user_profile.fullname?.slice(0, 2).toUpperCase() || "",
      fullname: user.user_profile.fullname || "",
      staff_email: user.user_profile.staff_email || "",
      role: user.user_profile.role || "",
      last_login: user.last_login
        ? format(parseISO(user.last_login), "dd MMMM yyyy")
        : "",
      member_since: user.created
        ? format(parseISO(user.created), "dd MMMM yyyy")
        : "",
    };
    setSelectedUser(mappedUser);
  };

  const handleStaffSelect = (staff: any) => {
    setSelectedWatcher(staff);
    setUseWatchersEndpoint(true);
    setAddUserFormData((prevData) => ({
      ...prevData,
      fullname: staff.fullname,
      role: staff.role,
    }));
  };

  return {
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
  };
}
