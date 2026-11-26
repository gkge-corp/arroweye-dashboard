"use client";

import { useMemo } from "react";

import type { useMailer } from "@/hooks/use-mailer";
import { renderInvitationHtml } from "@/lib/mailer/invitation-template";

type Mailer = ReturnType<typeof useMailer>;

const PREVIEW_LINKS = { accept: "#", decline: "#" };

/** Renders the same HTML guests receive; only the links and image source differ. */
export function InvitationPreview({ mailer }: { mailer: Mailer }) {
  const html = useMemo(
    () =>
      renderInvitationHtml({
        fields: mailer.invitation,
        links: PREVIEW_LINKS,
        imageSrc: mailer.image?.previewUrl,
      }),
    [mailer.invitation, mailer.image?.previewUrl],
  );

  return (
    <iframe
      title="Invitation preview"
      srcDoc={html}
      // Same origin so the local image preview loads; scripts stay disabled.
      sandbox="allow-same-origin"
      className="h-full min-h-[420px] w-full border-0 bg-[#efede7]"
    />
  );
}
