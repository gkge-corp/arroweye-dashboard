"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CreateMedia, deleteMedia, updateMedia } from "@/services";

export interface PublicationMedia {
  id: number;
  type: "Editorial";
  publication?: string | null;
  channel?: string | null;
  editorial_link?: string | null;
}

export const publicationChannels = [
  { value: "Website", label: "Website" },
  { value: "NewsLetter", label: "Newsletter" },
  { value: "Instagram", label: "Instagram" },
  { value: "Twitter", label: "Twitter" },
  { value: "Facebook", label: "Facebook" },
];

const emptyForm = {
  publication: "",
  channel: "",
  link: "",
};

type PublicationForm = typeof emptyForm;
type PublicationErrors = Partial<Record<keyof PublicationForm, string>>;

const toForm = (publication?: PublicationMedia): PublicationForm =>
  publication
    ? {
        publication: publication.publication ?? "",
        channel: publication.channel ?? "",
        link: publication.editorial_link ?? "",
      }
    : emptyForm;

const validatePublication = (form: PublicationForm): PublicationErrors => {
  const errors: PublicationErrors = {};
  if (!form.publication.trim()) errors.publication = "Publication is required.";
  if (!form.channel) errors.channel = "Channel is required.";
  if (!form.link.trim()) errors.link = "Link is required.";
  return errors;
};

interface UsePublicationFormOptions {
  open: boolean;
  projectId: number | string;
  /** Edits this publication; omit to create a new one. */
  publication?: PublicationMedia;
  onSaved?: () => void;
  onOpenChange: (open: boolean) => void;
}

export const usePublicationForm = ({
  open,
  projectId,
  publication,
  onSaved,
  onOpenChange,
}: UsePublicationFormOptions) => {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState<PublicationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormData(toForm(publication));
    setErrors({});
  }, [open, publication]);

  const setField = (name: keyof PublicationForm, value: string) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const nextErrors = validatePublication(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      type: "Editorial",
      publication: formData.publication.trim(),
      channel: formData.channel,
      editorial_link: formData.link.trim(),
    };

    setIsSaving(true);
    try {
      if (publication) {
        await updateMedia(publication.id, payload);
        toast.success("Publication updated.");
      } else {
        await CreateMedia(Number(projectId), payload);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      // The request layer has already shown the error toast.
      console.error("Saving publication failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    errors,
    setField,
    isSaving,
    isEditing: Boolean(publication),
    handleSubmit,
  };
};

export const useDeletePublication = (onDeleted?: () => void) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const removePublication = async (publication: PublicationMedia) => {
    setIsDeleting(true);
    try {
      await deleteMedia(publication.id);
      toast.success("Publication deleted.");
      onDeleted?.();
      return true;
    } catch (error) {
      // The request layer has already shown the error toast.
      console.error("Deleting publication failed:", error);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { removePublication, isDeleting };
};
