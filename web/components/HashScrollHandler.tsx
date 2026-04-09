"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function scrollToHash() {
  const hash = decodeURIComponent(window.location.hash.slice(1));

  if (!hash) {
    return true;
  }

  const element = document.getElementById(hash);

  if (!element) {
    return false;
  }

  element.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });

  return true;
}

export default function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    let frameId = 0;
    let attempts = 0;

    const runScroll = () => {
      attempts = 0;

      const tryScroll = () => {
        attempts += 1;

        if (scrollToHash() || attempts >= 12) {
          return;
        }

        frameId = window.requestAnimationFrame(tryScroll);
      };

      frameId = window.requestAnimationFrame(tryScroll);
    };

    runScroll();
    window.addEventListener("hashchange", runScroll);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", runScroll);
    };
  }, [pathname]);

  return null;
}
