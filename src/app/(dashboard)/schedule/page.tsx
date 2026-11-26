import React from "react";
import Schedule from "./component/Schedule";
import { MailerComposeLauncher } from "@/components/mailer/mailer-compose-launcher";

const SchedulePage = () => {
  return (
    <>
      <Schedule isDateClickEnabled={true} isSchedulePage={true} />
      <MailerComposeLauncher />
    </>
  );
};

export default SchedulePage;
