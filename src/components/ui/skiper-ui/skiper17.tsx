"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ReactNode } from "react";
import { useRef } from "react";

interface IdentifiedCard {
  id: number | string;
}

interface StickyCard002Props<T extends IdentifiedCard> {
  cards: T[];
  enabled: boolean;
  renderCard: (card: T, index: number) => ReactNode;
  className?: string;
  containerClassName?: string;
}

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function StickyCard002<T extends IdentifiedCard>({
  cards,
  enabled,
  renderCard,
  className,
  containerClassName,
}: StickyCard002Props<T>) {
  const container = useRef<HTMLDivElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (!enabled || !stack.current) return;

      gsap.registerPlugin(ScrollTrigger);
      const cardElements = cardRefs.current.filter(
        (card): card is HTMLDivElement => card !== null,
      );
      if (cardElements.length === 0) return;

      function setActiveCardInteractivity(index: number) {
        const activeIndex = Math.min(
          cardElements.length - 1,
          Math.max(0, index),
        );

        cardElements.forEach((card, cardIndex) => {
          const isActive = cardIndex === activeIndex;
          card.inert = !isActive;
          card.toggleAttribute("data-work-card-active", isActive);
        });
      }

      gsap.set(cardElements[0], { yPercent: 0, scale: 1, rotation: 0 });
      if (cardElements.length > 1) {
        gsap.set(cardElements.slice(1), {
          yPercent: 110,
          scale: 1,
          rotation: 0,
        });
      }
      setActiveCardInteractivity(0);

      const timeline = gsap.timeline();
      for (let index = 0; index < cardElements.length - 1; index += 1) {
        timeline.to(
          cardElements[index],
          {
            scale: 0.72,
            rotation: 4,
            duration: 1,
            ease: "none",
          },
          index,
        );
        timeline.to(
          cardElements[index + 1],
          {
            yPercent: 0,
            duration: 1,
            ease: "none",
          },
          index,
        );
      }

      const trigger = ScrollTrigger.create({
        animation: timeline,
        trigger: stack.current,
        pin: stack.current,
        start: "top top",
        end: () => `+=${window.innerHeight * (cardElements.length - 1)}`,
        scrub: 0.5,
        pinSpacing: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setActiveCardInteractivity(Math.round(self.progress * (cardElements.length - 1)));
        },
      });

      const resizeObserver = new ResizeObserver(() => trigger.refresh());
      resizeObserver.observe(stack.current);

      return () => {
        resizeObserver.disconnect();
        cardElements.forEach((card) => {
          card.inert = false;
          card.removeAttribute("data-work-card-active");
        });
        trigger.kill();
        timeline.kill();
        gsap.set(cardElements, { clearProps: "transform" });
      };
    },
    {
      scope: container,
      dependencies: [enabled, cards.length],
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={container}
      className={classes(
        "relative w-full",
        className,
      )}
      data-work-stack-mode={enabled ? "stack" : "list"}
    >
      <div
        ref={stack}
        className={
          enabled
            ? "relative flex h-dvh w-full items-center justify-center overflow-hidden px-10 py-20"
            : "mx-auto grid w-full max-w-6xl gap-6 px-5 pb-16 md:gap-10 md:px-10 md:pb-24"
        }
      >
        <div
          className={classes(
            enabled
              ? "relative aspect-[4/3] w-full max-w-5xl"
              : "contents",
            containerClassName,
          )}
        >
          {cards.map((card, index) => (
            <div
              key={card.id}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              className={
                enabled
                  ? "absolute inset-0 h-full w-full will-change-transform"
                  : "w-full"
              }
            >
              {renderCard(card, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { StickyCard002 };

/**
 * Skiper17 StickyCard_002 — React + GSAP + ScrollTrigger
 * Adapted for scoped lifecycle and renderable project media.
 * We respect the original creators. This is an inspired rebuild with our own
 * taste and does not claim any ownership.
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.me
 */
