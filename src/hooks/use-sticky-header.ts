"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

/**
 * Tracks when a `sticky top-0` header has reached the top of the dashboard
 * scroll container. Render the sentinel directly above the header; while
 * sticky, `fullHeaderHeight` lets callers reserve the height the header lost.
 * `headerRef` is only needed for that measurement.
 */
export function useStickyHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isStickyRef = useRef(false);
  const [isSticky, setIsSticky] = useState(false);
  const [fullHeaderHeight, setFullHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const sentinel = sentinelRef.current;
    const header = headerRef.current;
    const scrollContainer = document.getElementById(
      "dashboard-scroll-container",
    );

    if (!sentinel || !scrollContainer) return;

    const measureFullHeader = () => {
      if (!header || isStickyRef.current) return;

      const nextHeight = header.offsetHeight;
      setFullHeaderHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight,
      );
    };

    // The 2px margin stops the header flickering at the threshold once it shrinks.
    const updateStickyState = (synchronous = false) => {
      const rootTop = scrollContainer.getBoundingClientRect().top;
      const sentinelBottom = sentinel.getBoundingClientRect().bottom;
      const nextIsSticky = isStickyRef.current
        ? sentinelBottom <= rootTop + 2
        : sentinelBottom <= rootTop;

      if (nextIsSticky === isStickyRef.current) return;

      isStickyRef.current = nextIsSticky;
      const updateState = () => setIsSticky(nextIsSticky);

      if (synchronous) {
        flushSync(updateState);
      } else {
        updateState();
      }
    };

    measureFullHeader();
    updateStickyState();

    const resizeObserver = new ResizeObserver(measureFullHeader);
    if (header) resizeObserver.observe(header);
    const handleScroll = () => updateStickyState(true);
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return { sentinelRef, headerRef, isSticky, fullHeaderHeight };
}
