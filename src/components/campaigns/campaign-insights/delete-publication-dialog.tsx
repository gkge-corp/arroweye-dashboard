"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDeletePublication,
  type PublicationMedia,
} from "@/hooks/use-publication-form";

interface DeletePublicationDialogProps {
  publication?: PublicationMedia;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeletePublicationDialog({
  publication,
  onOpenChange,
  onDeleted,
}: DeletePublicationDialogProps) {
  const { removePublication, isDeleting } = useDeletePublication(onDeleted);
  const name = publication?.publication?.trim() || "this publication";

  const confirmDelete = async () => {
    if (!publication) return;
    if (await removePublication(publication)) onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(publication)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-medium uppercase tracking-[.16rem] text-zinc-500 dark:text-zinc-400">
            Delete Publication
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-300">
            &ldquo;{name}&rdquo; will be removed from this campaign. This
            can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 flex-row justify-start">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-9 rounded-full bg-red-600 text-white hover:bg-red-700"
            onClick={() => void confirmDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
