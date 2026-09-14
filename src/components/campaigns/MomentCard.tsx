import Image from "next/image";
import React, { useState } from "react";
import { MdOutlineFileDownload } from "react-icons/md";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog } from "primereact/dialog";
import { ClaimReward } from "@/services";
import { Skeleton } from "@/components/ui/skeleton";

interface MomentCardProps {
  giftingPin?: string;
  giftings?: any[];
  videoUrls: string[];
  reportUrls: string[];
  videoTitle: string;
  watchButtonText?: string;
  downloadButtonText?: string;
  radioButtonText?: string;
  downloadIcon?: boolean;
  outline?: boolean;
  subText?: string;
  MomentsTitle?: string;
  assetsButton?: string;
  csvData?: any;
  loading?: boolean;
}

const MomentCard: React.FC<MomentCardProps> = ({
  giftingPin,
  giftings,
  videoUrls = [],
  reportUrls = [],
  videoTitle,
  watchButtonText,
  downloadButtonText = "Download Data",
  radioButtonText,
  downloadIcon = true,
  outline = false,
  subText,
  MomentsTitle,
  assetsButton,
  csvData,
  loading = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const hasData = (videoUrls?.length ?? 0) > 0;

  const validateVideoUrls = () => hasData;

  const handlePlayClick = () => {
    if (validateVideoUrls()) {
      setIsPlaying(true);
    }
  };

  const handlePrevVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (validateVideoUrls()) {
      setCurrentVideoIndex((prev) =>
        prev === 0 ? videoUrls.length - 1 : prev - 1,
      );
      setIsPlaying(false);
    }
  };

  const handleNextVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (validateVideoUrls()) {
      setCurrentVideoIndex((prev) =>
        prev === videoUrls.length - 1 ? 0 : prev + 1,
      );
      setIsPlaying(false);
    }
  };

  const downloadCSV = (data: any, filename = "Data.csv") => {
    const headers = Object.keys(data).join(",") + "\n";
    const values = Object.values(data).join(",") + "\n";

    const csvContent = headers + values;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const mediaPreview = loading ? (
    <Skeleton className="h-[400px] w-full rounded-[8px]" />
  ) : hasData ? (
    <div className="relative flex h-[400px] items-center justify-center overflow-hidden rounded bg-black group">
      <>
        <iframe
          className="aspect-video h-full w-full"
          src={`${videoUrls[currentVideoIndex]}?autoplay=${isPlaying ? "1" : "0"}&controls=1&showinfo=0&rel=0`}
          title={`${videoTitle} - Video ${currentVideoIndex + 1}`}
          frameBorder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>

        {videoUrls.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePrevVideo}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleNextVideo}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {!isPlaying && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/40 transition-colors"
            onClick={handlePlayClick}
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-black border-b-[12px] border-b-transparent ml-1" />
            </div>
          </button>
        )}
      </>
    </div>
  ) : (
    <div
      role="img"
      aria-label="No media available"
      className="h-[400px] w-full rounded-[8px] bg-gray-200 dark:bg-muted/70"
    />
  );

  return (
    <div className="w-full max-h-[400px] space-y-[20px]">
      <p className="!text-[12px] font-[400] tracking-[.1rem] text-[#000000] font-SansFlex uppercase">
        {MomentsTitle}
      </p>

      {mediaPreview}

      <div className="space-y-[4px] flex flex-col items-center justify-center">
        {hasData && (
          <div className="flex items-center gap-2 w-full">
            {watchButtonText && (
              <button
                className="p-2 cursor-pointer hover:bg-orange-500 font-SansFlex text-[16px] font-[500] flex-grow rounded-full bg-black text-white text-center"
                onClick={() =>
                  window.open(videoUrls[currentVideoIndex], "_blank")
                }
                disabled={!videoUrls[currentVideoIndex]}
              >
                {watchButtonText}
              </button>
            )}

            {downloadIcon && watchButtonText && (
              <button
                className="bg-black hover:bg-orange-500 font-SansFlex text-[16px] font-medium text-white p-[11px] rounded-full inline-flex"
                onClick={() =>
                  window.open(videoUrls[currentVideoIndex], "_blank")
                }
                disabled={!videoUrls[currentVideoIndex]}
              >
                <MdOutlineFileDownload className="text-[16px]" />
              </button>
            )}
          </div>
        )}
        {hasData && assetsButton && (
          <p className="p-2 cursor-pointer text-[16px] font-[500] font-SansFlex w-full rounded text-center hover:bg-orange-500 bg-black text-white">
            {assetsButton}
          </p>
        )}
        <button
          className="p-2 font-SansFlex text-[16px] font-[500] w-full rounded-full text-white text-center cursor-pointer hover:bg-orange-500 bg-black inline-flex items-center gap-2 justify-center"
          onClick={() => downloadCSV(csvData)}
          // disabled={!reportUrls[currentVideoIndex]}
        >
          <p>{downloadButtonText}</p>
        </button>

        {/* {radioButtonText && (
          <button
            className={`p-2 cursor-pointer text-[16px] font-[500] font-SansFlex w-full rounded-full text-center ${
              outline
                ? "border border-black text-black hover:bg-black hover:text-white"
                : "hover:bg-orange-500 bg-black text-white"
            }`}
            onClick={() =>
              window.open(
                `https://studio-api.arroweye.pro${reportUrls[currentVideoIndex]}`,
                "_blank",
              )
            }
          >
            {radioButtonText}
          </button>
        )} */}

        {subText && (
          <p className="text-[12px] font-[400] text-center">{subText}</p>
        )}
      </div>
    </div>
  );
};

export default MomentCard;
