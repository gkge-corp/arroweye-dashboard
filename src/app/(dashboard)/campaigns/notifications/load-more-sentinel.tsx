"use client";

import { useEffect, useRef } from "react";

interface LoadMoreSentinelProps {
  onVisible: () => void;
}

// Fires onVisible when the bottom of the list scrolls into view.
export function LoadMoreSentinel({ onVisible }: LoadMoreSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onVisibleRef.current();
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} aria-hidden="true" className="h-px" />;
}
