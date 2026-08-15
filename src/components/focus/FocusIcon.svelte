<script>
  import LayoutPanelLeft from '@jis3r/icons/icons/layout-panel-left'
  import Route from '@jis3r/icons/icons/route'
  import Cpu from '@jis3r/icons/icons/cpu'

  // Named subpaths rather than the barrel: the package ships 555 components
  // and importing the index puts all of them in the graph.
  const ICONS = {
    'layout-panel-left': LayoutPanelLeft,
    route: Route,
    cpu: Cpu,
  }

  // The longest of the three runs is cpu's two-beat pulse at 1.0s. Release a
  // little after that: upstream's own mouseenter handler early-returns while
  // `animate` is true, so holding it would animate once and then never again.
  const RUN_MS = 1100

  let { icon, delay = 0 } = $props()

  const Glyph = ICONS[icon]

  let animate = $state(false)

  // client:visible hydrates this island when it enters the viewport, so mount
  // already means "in view". No second observer is needed, and the stagger is
  // a prop rather than shared state between the three islands.
  $effect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const start = setTimeout(() => {
      animate = true
    }, delay)
    const end = setTimeout(() => {
      animate = false
    }, delay + RUN_MS)

    return () => {
      clearTimeout(start)
      clearTimeout(end)
    }
  })
</script>

<span class="focus-icon" aria-hidden="true">
  <Glyph {animate} size={20} strokeWidth={1.5} />
</span>

<style>
  .focus-icon {
    display: inline-flex;
    align-items: center;
    color: var(--color-muted);
  }

  /* The other half of the reduced-motion guard — the one that stops a hover
     starting a run — is in global.css, because it has to reach inside the
     upstream component's own scoped styles. */
</style>
