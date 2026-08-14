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

export interface StackCardInteractivityTarget {
  inert: boolean;
  toggleAttribute: (qualifiedName: string, force?: boolean) => boolean | void;
  removeAttribute: (qualifiedName: string) => void;
}

export const WORK_CARD_ACTIVE_ATTRIBUTE = "data-work-card-active";

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

/**
 * Below this scene width the frame is portrait (see `.work-stack-frame`) and a
 * full screen of scrolling per card is a lot of thumb, so the stack costs less
 * scroll per card. Matches Tailwind's `sm` breakpoint, which is where the frame
 * ratio flips.
 */
const NARROW_VIEWPORT_WIDTH = 640;
const NARROW_SCROLL_FACTOR = 0.7;

export function getStackScrollDistance(
  sceneHeight: number,
  cardCount: number,
  factor = 1,
) {
  return (
    Math.max(0, sceneHeight) * Math.max(0, cardCount - 1) * Math.max(0, factor)
  );
}

function clampActiveCardIndex(index: number, cardCount: number) {
  if (cardCount <= 0) return -1;

  return Math.min(cardCount - 1, Math.max(0, index));
}

export function getActiveCardIndexFromProgress(
  progress: number,
  cardCount: number,
) {
  return clampActiveCardIndex(Math.round(progress * (cardCount - 1)), cardCount);
}

export function setActiveCardInteractivity(
  cardElements: StackCardInteractivityTarget[],
  index: number,
) {
  const activeIndex = clampActiveCardIndex(index, cardElements.length);
  if (activeIndex < 0) return;

  cardElements.forEach((card, cardIndex) => {
    const isActive = cardIndex === activeIndex;
    card.inert = !isActive;
    card.toggleAttribute(WORK_CARD_ACTIVE_ATTRIBUTE, isActive);
  });
}

export function resetCardInteractivity(
  cardElements: StackCardInteractivityTarget[],
) {
  cardElements.forEach((card) => {
    card.inert = false;
    card.removeAttribute(WORK_CARD_ACTIVE_ATTRIBUTE);
  });
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
      // iOS Safari fires a resize every time its URL bar collapses or expands,
      // which lands mid-scroll through the pinned stack and recomputes the pin
      // under the visitor. This is GSAP's own switch for that.
      ScrollTrigger.config({ ignoreMobileResize: true });
      const cardElements = cardRefs.current.filter(
        (card): card is HTMLDivElement => card !== null,
      );
      if (cardElements.length === 0) return;

      gsap.set(cardElements[0], { yPercent: 0, scale: 1, rotation: 0 });
      if (cardElements.length > 1) {
        gsap.set(cardElements.slice(1), {
          yPercent: 110,
          scale: 1,
          rotation: 0,
        });
      }
      setActiveCardInteractivity(cardElements, 0);

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
        // The scene is full width, so its width stands in for the viewport's.
        // Read here rather than at hydration: `end` runs on refresh, so it can
        // measure without the server and client disagreeing about the markup.
        end: () => {
          const sceneWidth = stack.current?.clientWidth ?? 0;
          const narrow = sceneWidth > 0 && sceneWidth < NARROW_VIEWPORT_WIDTH;

          return `+=${getStackScrollDistance(
            stack.current?.clientHeight ?? 0,
            cardElements.length,
            narrow ? NARROW_SCROLL_FACTOR : 1,
          )}`;
        },
        scrub: 0.5,
        pinSpacing: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          setActiveCardInteractivity(
            cardElements,
            getActiveCardIndexFromProgress(self.progress, cardElements.length),
          );
        },
      });

      // Width changes are the ones that matter: they change the frame ratio and
      // the scroll distance. Height changes on a phone are mostly the URL bar
      // moving, and refreshing on those is what made the pin jump mid-scroll,
      // so the observer only reacts once the width has actually moved.
      let lastWidth = stack.current.clientWidth;
      const resizeObserver = new ResizeObserver(() => {
        const width = stack.current?.clientWidth ?? lastWidth;
        if (width === lastWidth) return;

        lastWidth = width;
        trigger.refresh();
      });
      resizeObserver.observe(stack.current);

      return () => {
        resizeObserver.disconnect();
        resetCardInteractivity(cardElements);
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
            ? "relative flex h-svh w-full items-center justify-center overflow-hidden px-4 py-10 sm:px-10 sm:py-20"
            : "mx-auto grid w-full max-w-6xl gap-6 px-5 pb-16 pt-28 md:gap-10 md:px-10 md:pb-24 md:pt-32"
        }
      >
        <div
          className={classes(
            enabled
              ? "work-stack-frame relative overflow-hidden rounded-lg"
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
