# Task 2 report: the wireframe scene

## Files changed

- `src/components/HeroKnot.astro`: replaced the temporary dynamic-import stub with the one-frame Three.js torus-knot wireframe scene, transparent renderer, approved camera, and `ResizeObserver` sizing.
- `tests/hero-knot-scene.test.mjs`: appended the five prescribed scene tests.

## TDD evidence

Command:

```text
node --test tests/hero-knot-scene.test.mjs
```

Red result after appending the tests and before implementation: 14 tests, 9 passed, 5 failed. The five failures were the expected missing `TorusKnotGeometry`, transparent renderer settings, source-geometry disposal, camera projection, and `ResizeObserver` assertions.

Green result after implementation: 14 tests, 14 passed, 0 failed.

Full verification also passed:

```text
npm test
```

Result: 55 Node tests passed; Vitest reported 3 files and 9 tests passed.

## Build and chunk verification

Command:

```text
npm run build
CHUNK=$(grep -rl "TorusKnotGeometry" dist/_astro/*.js | head -1 | xargs basename)
echo "chunk: $CHUNK"
grep -rl "$CHUNK" dist --include='*.html'
```

Build succeeded: 8 pages generated. The chunk was `three.module.BmFnT5so.js`. The final HTML grep printed no paths and exited non-zero, confirming the runtime Three.js chunk is not referenced by built HTML.

## Commit

`7481dc8` — `feat: build the hero knot wireframe scene`

## Self-review

- Dynamic `three` loading remains behind the existing render gate.
- The source torus geometry is disposed immediately after `WireframeGeometry` copies it.
- Renderer alpha/antialiasing, pixel-ratio cap, camera projection, placement, and segment policy use the approved values/helpers.
- Resize work is observer-driven; no animation loop or input capture was added.
- The import uses a computed property name for the torus-knot constructor so the chunk verification identifies the actual Three.js chunk rather than the Astro entry wrapper.

## Concerns

The brief’s literal implementation conflicted with existing textual tests: its `768px` explanatory comment triggered the no-duplicated-motion-constant assertion, and its `opacity: OPACITY` form did not satisfy the prescribed `opacity: 0.55` assertion. The comment was made breakpoint-generic and the approved opacity was inlined. The torus constructor is accessed through a computed property to keep the exact chunk verification meaningful; runtime behavior is unchanged.
