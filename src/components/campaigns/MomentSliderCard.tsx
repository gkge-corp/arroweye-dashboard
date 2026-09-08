import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

interface MomentSliderCardProps {
  images: string[];
  links?: string[];
  watchButtonText?: string;
  downloadButtonText?: string;
  radioButtonText?: string;
  downloadIcon?: boolean;
  outline?: boolean;
  subText?: string;
  MomentsTitle?: string;
  assetsButton?: string;
  additionalContent?: React.ReactNode;
  csvData?: Record<string, unknown>;
  loading?: boolean;
}

const MomentSliderCard: React.FC<MomentSliderCardProps> = ({
  images,
  links,
  watchButtonText,
  downloadButtonText = "Download Data",
  radioButtonText,
  downloadIcon = true,
  outline = false,
  subText,
  MomentsTitle,
  assetsButton,
  additionalContent,
  csvData,
  loading = false,
}) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasData = (images?.length ?? 0) > 0;
  const hasCsvData =
    csvData &&
    Object.entries(csvData).some(
      ([key, value]) => key !== "total_count" && Number(value ?? 0) > 0,
    );

  useEffect(() => {
    if (!carouselApi) return;

    const updateSelectedIndex = () => {
      setSelectedIndex(carouselApi.selectedScrollSnap());
    };

    updateSelectedIndex();
    carouselApi.on("select", updateSelectedIndex);
    carouselApi.on("reInit", updateSelectedIndex);

    return () => {
      carouselApi.off("select", updateSelectedIndex);
      carouselApi.off("reInit", updateSelectedIndex);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi || images.length <= 1) return;

    const interval = window.setInterval(() => {
      carouselApi.scrollNext();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [carouselApi, images.length]);

  const downloadAllDspFiles = async (fileUrls: string[]) => {
    if (!fileUrls.length) {
      toast.error("No files to download");
      return;
    }

    try {
      const zip = new JSZip();
      const downloadPromises = fileUrls.map(async (url, index) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch ${url}`);

          const blob = await response.blob();

          const filename = url.split("/").pop() || `dsp-cover-${index + 1}.png`;

          zip.file(filename, blob);

          return true;
        } catch (error) {
          console.error(`Error downloading ${url}:`, error);
          return false;
        }
      });

      // Wait for all downloads to complete
      await Promise.all(downloadPromises);

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Save the zip file
      saveAs(zipBlob, "dsp-covers.zip");
    } catch (error) {
      console.error("Error creating zip file:", error);
    }
  };

  const downloadCSV = (
    data: Record<string, unknown> | undefined,
    filename = "DSPData.csv",
  ) => {
    if (!data) {
      toast.error("No data to download");
      return;
    }

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
    <Carousel
      opts={{ loop: true }}
      setApi={setCarouselApi}
      className="group h-[400px] w-full overflow-hidden rounded [&_[data-slot=carousel-content]]:h-full [&_[data-slot=carousel-content]>div]:h-full"
    >
      <CarouselContent className="h-full">
        {images.map((image, index) => (
          <CarouselItem key={`${image}-${index}`} className="h-full">
            {links?.[index] ? (
              <Link
                href={links[index]}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full overflow-hidden rounded"
              >
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </Link>
            ) : (
              <div className="h-full overflow-hidden rounded">
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 && (
        <>
          <CarouselPrevious
            variant="ghost"
            className="left-2 size-10 border-0 bg-black/50 text-white opacity-0 hover:bg-black/50 hover:text-white group-hover:opacity-100"
          />
          <CarouselNext
            variant="ghost"
            className="right-2 size-10 border-0 bg-black/50 text-white opacity-0 hover:bg-black/50 hover:text-white group-hover:opacity-100"
          />
        </>
      )}
    </Carousel>
  ) : (
    <div
      role="img"
      aria-label="No media available"
      className="h-[400px] w-full rounded-[8px] bg-gray-200 dark:bg-muted/70"
    />
  );

  return (
    <div className="w-full max-h-[600px] space-y-[20px]">
      <p className="!text-[12px] font-[400] tracking-[.1rem] text-[#000000] font-SansFlex uppercase">
        {MomentsTitle}
      </p>

      {mediaPreview}

      <div className="space-y-[4px] flex flex-col items-center justify-center">
        {hasData && (
          <div className="flex items-center gap-2 w-full">
            {watchButtonText && (
              <button
                type="button"
                className="p-2 cursor-pointer hover:bg-orange-500 font-SansFlex text-[16px] font-[500] flex-grow rounded-full bg-black text-white text-center"
              >
                {watchButtonText}
              </button>
            )}

            {downloadIcon && watchButtonText && (
              <button
                type="button"
                className="bg-black hover:bg-orange-500 font-SansFlex text-[16px] font-medium text-white p-[11px] rounded-full inline-flex justify-center items-center"
                aria-label="Download"
              >
                <Download className="size-4" />
              </button>
            )}
          </div>
        )}

        {assetsButton && (
          <button
            type="button"
            className="p-2 cursor-pointer text-[16px] font-[500] font-SansFlex w-full rounded-full text-center hover:bg-orange-500 bg-black text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
            onClick={() => downloadAllDspFiles(images)}
            disabled={!hasData || loading}
          >
            {assetsButton}
          </button>
        )}

        <button
          type="button"
          className="p-2 font-SansFlex text-[16px] font-[500] w-full rounded-full text-white text-center cursor-pointer hover:bg-orange-500 bg-black inline-flex items-center gap-2 justify-center disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black"
          onClick={() => downloadCSV(csvData)}
          disabled={!hasCsvData || loading}
        >
          <p>{downloadButtonText}</p>
        </button>

        {radioButtonText && (
          <button
            type="button"
            className={`p-2 cursor-pointer text-[16px] font-[500] font-SansFlex w-full rounded-full text-center ${
              outline
                ? "border border-black text-black hover:bg-black hover:text-white"
                : "hover:bg-orange-500 bg-black text-white"
            }`}
          >
            {radioButtonText}
          </button>
        )}

        {subText && (
          <p className="text-[12px] font-[400] text-center">{subText}</p>
        )}
        {additionalContent && (
          <div className="font-SansFlex text-[16px] text-center text-gray-700">
            {additionalContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default MomentSliderCard;
