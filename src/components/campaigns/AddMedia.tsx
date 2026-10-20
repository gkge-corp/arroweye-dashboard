import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Moments from "./Moments";
import Recap from "./Recap";
import DspCovers from "./DspCovers";
import EditorialAddMedia from "./EditorialAddMedia";
import GiftingAddMedia from "./GiftingAddMedia";

interface CompanyDetailsFormProps {
  visible: boolean;
  onHide: () => void;
  onSuccess?: () => void;
  initialTab?: "moments" | "Recap" | "Dsp" | "Shazam" | "Editorial" | "Gifting";
}

const AddMedia: React.FC<CompanyDetailsFormProps> = ({
  visible,
  onHide,
  onSuccess,
  initialTab = "moments",
}) => {
  const [activeDetailsTab, setActiveDetailsTab] = useState(initialTab);

  useEffect(() => {
    if (visible) {
      setActiveDetailsTab(initialTab);
    }
  }, [visible, initialTab]);

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] gap-0 overflow-y-auto rounded-2xl border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-[920px]">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-[12px] font-[500] uppercase tracking-[.16rem] text-zinc-500 dark:text-zinc-400">
            Media
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit saved media or add another media source.
          </DialogDescription>
          <InfoTooltip info="The total revenue is the overall amount of money generated from the sale of goods or services before any expenses are deducted." />
        </DialogHeader>

        <Tabs
          value={activeDetailsTab}
          onValueChange={(v) => setActiveDetailsTab(v as typeof initialTab)}
          className="mt-4 border-b border-zinc-200 dark:border-zinc-700"
        >
          <TabsList className="h-auto max-w-full justify-start overflow-x-auto whitespace-nowrap scrollbar-hide rounded-none p-0 bg-transparent">
            <TabsTrigger
              value="moments"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-normal text-zinc-500 data-[state=active]:border-zinc-950 data-[state=active]:font-medium data-[state=active]:text-zinc-950 dark:text-zinc-400 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100"
            >
              Moments
            </TabsTrigger>
            <TabsTrigger
              value="Recap"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-normal text-zinc-500 data-[state=active]:border-zinc-950 data-[state=active]:font-medium data-[state=active]:text-zinc-950 dark:text-zinc-400 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100"
            >
              Recap
            </TabsTrigger>
            <TabsTrigger
              value="Dsp"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-normal text-zinc-500 data-[state=active]:border-zinc-950 data-[state=active]:font-medium data-[state=active]:text-zinc-950 dark:text-zinc-400 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100"
            >
              DSP Covers
            </TabsTrigger>
            <TabsTrigger
              value="Editorial"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-normal text-zinc-500 data-[state=active]:border-zinc-950 data-[state=active]:font-medium data-[state=active]:text-zinc-950 dark:text-zinc-400 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100"
            >
              Editorial
            </TabsTrigger>
            <TabsTrigger
              value="Gifting"
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-normal text-zinc-500 data-[state=active]:border-zinc-950 data-[state=active]:font-medium data-[state=active]:text-zinc-950 dark:text-zinc-400 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100"
            >
              Gifting
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="py-5">
          {activeDetailsTab === "moments" && <Moments onSuccess={onSuccess} />}
          {activeDetailsTab === "Recap" && <Recap onSuccess={onSuccess} />}
          {activeDetailsTab === "Dsp" && <DspCovers onSuccess={onSuccess} />}
          {activeDetailsTab === "Editorial" && (
            <EditorialAddMedia onSuccess={onSuccess} />
          )}
          {activeDetailsTab === "Gifting" && <GiftingAddMedia />}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMedia;
