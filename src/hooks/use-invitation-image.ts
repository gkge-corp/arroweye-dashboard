"use client";

import { useState } from "react";
import { toast } from "sonner";

import { getMailerImageUpload } from "@/actions/mailer";
import { MAILER_IMAGE_MAX_BYTES, MAILER_IMAGE_TYPES } from "@/lib/mailer/limits";

export interface InvitationImage {
  file: File;
  name: string;
  previewUrl: string;
  /** Set once uploaded at send time, so a test then a real send upload once. */
  key?: string;
}

const validateImageFile = (file: File) => {
  if (!MAILER_IMAGE_TYPES.includes(file.type)) {
    return "Use a PNG, JPG, GIF or WebP image.";
  }
  if (file.size > MAILER_IMAGE_MAX_BYTES) {
    return "Images must be 5MB or smaller.";
  }
  return null;
};

const uploadImageFile = async (file: File) => {
  const upload = await getMailerImageUpload(file.name, file.size);
  if (!upload.success) throw new Error(upload.message);

  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": upload.contentType },
    body: file,
  });
  if (!response.ok) throw new Error("The image could not be uploaded.");

  return upload.key;
};

/** The hero image stays in the page until a send needs it in storage. */
export const useInvitationImage = () => {
  const [image, setImage] = useState<InvitationImage | null>(null);

  const removeImage = () => {
    if (image) URL.revokeObjectURL(image.previewUrl);
    setImage(null);
  };

  const pickImage = (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    removeImage();
    setImage({ file, name: file.name, previewUrl: URL.createObjectURL(file) });
  };

  /** Uploads on first use and returns the storage key; undefined when there's no image. */
  const ensureImageUploaded = async () => {
    if (!image) return undefined;
    if (image.key) return image.key;

    const key = await uploadImageFile(image.file);
    setImage((current) =>
      current?.previewUrl === image.previewUrl ? { ...current, key } : current,
    );
    return key;
  };

  return { image, pickImage, removeImage, ensureImageUploaded };
};
