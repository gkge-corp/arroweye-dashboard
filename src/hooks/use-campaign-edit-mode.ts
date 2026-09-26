import { useState } from "react";

export function useCampaignEditMode() {
  const [toggleNotifications, setToggleNotifications] = useState(false);
  const [editModeOff, setEditModeOff] = useState(false);
  const [showIcons, setShowIcons] = useState(false);

  const requestEditModeChange = (enabled: boolean) => {
    if (enabled) {
      setToggleNotifications(true);
    } else {
      setEditModeOff(true);
    }
  };

  const confirmEditModeOff = () => {
    setEditModeOff(false);
    setToggleNotifications(false);
  };

  const cancelEditModeOff = () => {
    setEditModeOff(false);
    setToggleNotifications(true);
  };

  return {
    toggleNotifications,
    editModeOff,
    showIcons,
    setEditModeOff,
    setShowIcons,
    requestEditModeChange,
    confirmEditModeOff,
    cancelEditModeOff,
  };
}
