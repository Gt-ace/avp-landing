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

export function getStackFrameStyle(enabled: boolean) {
  return enabled
    ? {
        width: "min(64rem, 100%, calc((100dvh - 10rem) * 4 / 3))",
      }
    : undefined;
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
        end: () => `+=${window.innerHeight * (cardElements.length - 1)}`,
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

      const resizeObserver = new ResizeObserver(() => trigger.refresh());
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
            ? "relative flex h-dvh w-full items-center justify-center overflow-hidden px-10 py-20"
            : "mx-auto grid w-full max-w-6xl gap-6 px-5 pb-16 pt-28 md:gap-10 md:px-10 md:pb-24 md:pt-32"
        }
      >
        <div
          className={classes(
            enabled
              ? "relative aspect-[4/3] w-full max-w-5xl overflow-hidden rounded-lg"
              : "contents",
            containerClassName,
          )}
          style={getStackFrameStyle(enabled)}
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
