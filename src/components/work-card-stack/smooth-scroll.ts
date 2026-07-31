import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/**
 * Drive Lenis from the GSAP ticker so the smooth scroller and ScrollTrigger's
 * pinned card stack advance on the same frame. Without this they run on
 * separate loops and the pinned card jitters.
 */
export function startSmoothScroll() {
  gsap.registerPlugin(ScrollTrigger)

  const lenis = new Lenis({ autoRaf: false })
  const syncScrollTrigger = () => ScrollTrigger.update()
  const advanceLenis = (time: number) => lenis.raf(time * 1000)

  lenis.on('scroll', syncScrollTrigger)
  gsap.ticker.add(advanceLenis)
  gsap.ticker.lagSmoothing(0)

  return () => {
    gsap.ticker.remove(advanceLenis)
    gsap.ticker.lagSmoothing(500, 33)
    lenis.off('scroll', syncScrollTrigger)
    lenis.destroy()
  }
}
