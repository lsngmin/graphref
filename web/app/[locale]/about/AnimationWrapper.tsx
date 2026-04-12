"use client";

import { useEffect, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AnimationWrapper({ children }: { children: ReactNode }) {
  useEffect(() => {
    // ── Fade-up for each major section ──────────────────────────
    const sections = gsap.utils.toArray<HTMLElement>(".about-section");
    sections.forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 52 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 84%",
            once: true,
          },
        }
      );
    });

    // ── Staggered grid items (timeline, values) ──────────────────
    const staggerGroups = gsap.utils.toArray<HTMLElement>(".stagger-group");
    staggerGroups.forEach((group) => {
      const items = group.querySelectorAll<HTMLElement>(".stagger-item");
      if (!items.length) return;
      gsap.fromTo(
        items,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.09,
          ease: "power2.out",
          scrollTrigger: {
            trigger: group,
            start: "top 84%",
            once: true,
          },
        }
      );
    });

    // ── Story split: text left, visual right ────────────────────
    const splitPairs = gsap.utils.toArray<HTMLElement>(".split-pair");
    splitPairs.forEach((pair) => {
      const [left, right] = Array.from(pair.children) as HTMLElement[];
      if (!left || !right) return;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: pair, start: "top 84%", once: true },
      });
      tl.fromTo(left,  { opacity: 0, x: -32 }, { opacity: 1, x: 0, duration: 0.75, ease: "power2.out" })
        .fromTo(right, { opacity: 0, x: 32  }, { opacity: 1, x: 0, duration: 0.75, ease: "power2.out" }, "<0.1");
    });

    // ── Stats count-up feel ─────────────────────────────────────
    const statsBlock = document.querySelector<HTMLElement>(".stats-block");
    if (statsBlock) {
      gsap.fromTo(
        statsBlock,
        { opacity: 0, scale: 0.97 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: { trigger: statsBlock, start: "top 84%", once: true },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return <>{children}</>;
}
