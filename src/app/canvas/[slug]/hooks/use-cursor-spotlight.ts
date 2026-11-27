"use client";

import type { MouseEvent } from "react";

const HIDDEN = "-9999px";

/**
 * Writes the cursor position into --spot-x / --spot-y on the hovered element,
 * straight to the DOM so moving the mouse doesn't re-render React.
 */
export function useCursorSpotlight() {
  const onMouseMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };

  const onMouseLeave = (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty("--spot-x", HIDDEN);
    event.currentTarget.style.setProperty("--spot-y", HIDDEN);
  };

  return { onMouseMove, onMouseLeave };
}
