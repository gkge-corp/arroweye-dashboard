"use client";

import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ARTIST_SOCIAL_PLATFORMS,
  PLAYLIST_PLATFORMS,
  REACH_PLATFORMS,
  type AnalyticsPlatform,
} from "@/lib/music-analytics/platforms";
import {
  mergeStreamingPlatforms,
  resolveStreamingSelection,
  type InsightSources,
} from "@/hooks/use-insight-sources";

export type InsightSourceScope = "airplay" | "social" | "streaming";
type StreamingTab = "streaming" | "performance";

interface InsightSourcesDialogProps {
  open: boolean;
  scope: InsightSourceScope;
  sources: InsightSources;
  /** Markets this song actually has spins in, most played first. */
  markets: string[];
  /**
   * Streaming platforms offered for this song: the ones playlists can be
   * pulled from, plus any extra platform Soundcharts reports audience for
   * (Anghami, JioSaavn and friends have no playlist endpoint but still draw a
   * bar on the STREAMING chart).
   */
  streamingPlatforms?: AnalyticsPlatform[];
  selectedMarkets: string[];
  spinsByCountry?: Record<string, number>;
  onOpenChange: (open: boolean) => void;
  onApplySources: (sources: InsightSources) => void;
  onApplyMarkets: (markets: string[] | null) => void;
}

const CheckboxRow = ({
  label,
  checked,
  onToggle,
}: {
  label: string;
  meta?: string;
  checked: boolean;
  onToggle: () => void;
}) => (
  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
    <Checkbox checked={checked} onChange={onToggle} />
    <span className="min-w-0 flex-1 truncate font-SansFlex text-[14px] text-foreground">
      {label}
    </span>
  </label>
);

const SelectionHeader = ({
  selected,
  total,
  onSetAll,
}: {
  selected: number;
  total: number;
  onSetAll: (all: boolean) => void;
}) => (
  <div className="flex items-center justify-between border-b pb-2">
    <button
      type="button"
      className="cursor-pointer font-SansFlex text-[13px] font-[500] text-foreground underline underline-offset-2 hover:text-orange-500"
      onClick={() => onSetAll(selected !== total)}
    >
      {selected === total ? "Clear all" : "Select all"}
    </button>
    <span className="font-SansFlex text-[12px] text-muted-foreground">
      {selected} of {total} selected
    </span>
  </div>
);

const PlatformPicker = ({
  platforms,
  selected,
  onChange,
}: {
  platforms: AnalyticsPlatform[];
  selected: string[];
  onChange: (codes: string[]) => void;
}) => (
  <>
    <SelectionHeader
      selected={selected.length}
      total={platforms.length}
      onSetAll={(all) =>
        onChange(all ? platforms.map((platform) => platform.code) : [])
      }
    />
    <div className="space-y-1">
      {platforms.map((platform) => (
        <CheckboxRow
          key={platform.code}
          label={platform.label}
          // meta="1 call"
          checked={selected.includes(platform.code)}
          onToggle={() =>
            onChange(
              selected.includes(platform.code)
                ? selected.filter((code) => code !== platform.code)
                : [...selected, platform.code],
            )
          }
        />
      ))}
    </div>
  </>
);

export function InsightSourcesDialog({
  open,
  scope,
  sources,
  markets,
  streamingPlatforms,
  selectedMarkets,
  spinsByCountry,
  onOpenChange,
  onApplySources,
  onApplyMarkets,
}: InsightSourcesDialogProps) {
  const [draft, setDraft] = useState<InsightSources>(sources);
  const [marketDraft, setMarketDraft] = useState<string[]>(selectedMarkets);
  const [tab, setTab] = useState<StreamingTab>("streaming");

  const streamingOptions = React.useMemo(
    () => mergeStreamingPlatforms(streamingPlatforms),
    [streamingPlatforms],
  );

  useEffect(() => {
    if (!open) return;
    setDraft({
      ...sources,
      playlistPlatforms: resolveStreamingSelection(sources, streamingOptions),
    });
    setMarketDraft(selectedMarkets);
    setTab("streaming");
  }, [open, sources, selectedMarkets, streamingOptions]);

  const isAirplay = scope === "airplay";
  const isSocial = scope === "social";

  const apply = () => {
    if (isAirplay) {
      onApplyMarkets(marketDraft);
    } else {
      // Record what was on offer, so a platform left unchecked here reads as
      // declined next time rather than as one the viewer never saw.
      onApplySources({
        ...draft,
        knownStreamingPlatforms: streamingOptions.map(
          (platform) => platform.code,
        ),
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl border-zinc-200 bg-white p-6 text-zinc-950 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-[500] uppercase tracking-[.1rem] text-zinc-500 dark:text-zinc-400">
            {isAirplay
              ? "Countries streamed"
              : isSocial
                ? "Social sources"
                : "Streaming sources"}
          </DialogTitle>
        </DialogHeader>

        {!isAirplay && !isSocial && (
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as StreamingTab)}
          >
            <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0">
              <TabsTrigger value="streaming" className="text-sm">
                Streaming
              </TabsTrigger>
              <TabsTrigger value="performance" className="text-sm">
                Performance
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="max-h-[320px] space-y-2 overflow-y-auto">
          {isSocial ? (
            <div className="space-y-3">
              <p className="font-SansFlex text-[12px] text-muted-foreground">
                TikTok, Instagram and Genius come from the song itself and are
                always included. Facebook and Twitter have no song-level data,
                so these add the artist&apos;s follower counts
              </p>
              <PlatformPicker
                platforms={ARTIST_SOCIAL_PLATFORMS}
                selected={draft.artistSocialPlatforms}
                onChange={(codes) =>
                  setDraft((current) => ({
                    ...current,
                    artistSocialPlatforms: codes,
                  }))
                }
              />
            </div>
          ) : isAirplay ? (
            markets.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No countries streamed yet for this song.
              </p>
            ) : (
              <>
                <SelectionHeader
                  selected={marketDraft.length}
                  total={markets.length}
                  onSetAll={(all) => setMarketDraft(all ? [...markets] : [])}
                />
                <div className="space-y-1">
                  {markets.map((market) => (
                    <CheckboxRow
                      key={market}
                      label={market}
                      meta={`${(spinsByCountry?.[market] ?? 0).toLocaleString()} spins`}
                      checked={marketDraft.includes(market)}
                      onToggle={() =>
                        setMarketDraft((current) =>
                          current.includes(market)
                            ? current.filter((entry) => entry !== market)
                            : [...current, market],
                        )
                      }
                    />
                  ))}
                </div>
              </>
            )
          ) : tab === "streaming" ? (
            <PlatformPicker
              platforms={streamingOptions}
              selected={draft.playlistPlatforms}
              onChange={(codes) =>
                setDraft((current) => ({
                  ...current,
                  playlistPlatforms: codes,
                }))
              }
            />
          ) : (
            <PlatformPicker
              platforms={REACH_PLATFORMS}
              selected={draft.reachPlatforms}
              onChange={(codes) =>
                setDraft((current) => ({ ...current, reachPlatforms: codes }))
              }
            />
          )}
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-full"
            onClick={() => {
              if (isAirplay) setMarketDraft([...markets]);
              else if (isSocial)
                setDraft((current) => ({
                  ...current,
                  artistSocialPlatforms: [],
                }));
              else
                setDraft((current) => ({
                  ...current,
                  playlistPlatforms: streamingOptions.map((p) => p.code),
                  reachPlatforms: REACH_PLATFORMS.map((p) => p.code),
                }));
            }}
          >
            Reset
          </Button>
          <Button
            type="button"
            className="h-11 flex-1 rounded-full bg-black text-white hover:bg-orange-500 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-orange-500 dark:hover:text-white"
            onClick={apply}
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InsightSourcesDialog;
