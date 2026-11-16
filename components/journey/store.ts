/**
 * Scroll → scene state. One rAF loop (started by <Backdrop />) measures the
 * chapter sections and writes here; the WebGL scene and the UI chrome read it.
 */

/** `shapes` = how many particle shapes the chapter steps through (one per text beat). */
export const SCENES = [
  { id: 'top', label: 'Intro', shapes: 1 },
  { id: 'manifesto', label: 'About', shapes: 1 },
  { id: 'work', label: 'Work', shapes: 1 },
  { id: 'principles', label: 'Conviction', shapes: 1 },
  { id: 'journey', label: 'Journey', shapes: 3 }, // one company logo per chapter
  { id: 'vision', label: 'Vision', shapes: 1 }, // globe
  { id: 'contact', label: 'Contact', shapes: 1 },
] as const;

/** Index of each chapter's first shape in the flat shape list. */
const BASE: number[] = [];
/** Chapter that owns each shape. */
export const SHAPE_CHAPTER: number[] = [];
SCENES.forEach((s, i) => {
  BASE.push(SHAPE_CHAPTER.length);
  for (let k = 0; k < s.shapes; k++) SHAPE_CHAPTER.push(i);
});
export const SHAPE_COUNT = SHAPE_CHAPTER.length;

export const sceneState = {
  /** chapter whose box contains the viewport centre */
  index: 0,
  /** 0→1 progress through that chapter */
  local: 0,
  /** shape morph pair (indices into the flat shape list) and amount */
  from: 0,
  to: 0,
  mix: 0,
  /** 0→1 progress through the whole page */
  page: 0,
  /** -1→1 pointer position */
  px: 0,
  py: 0,
  /** pointer is over the page (mouse) or pressing (touch) */
  pActive: false,
  /** Samir's particle portrait on screen (CSS px) and how fully the particles hold its shape
   *  (0→1), so the real photo in the Manifesto can sit exactly over it. */
  portrait: { x: 0, y: 0, w: 0, h: 0, on: 0 },
  /** Top of the About section relative to the viewport (CSS px). On phones the portrait sits
   *  above the About copy like an image and scrolls away with it. */
  aboutTop: 0,
  /** Top of the Contact section relative to the viewport (CSS px). The portal scrolls away with
   *  that section, so the "Let's talk" title and the form never slide in under its ring. */
  contactTop: 0,
};

type Listener = (index: number) => void;
const listeners = new Set<Listener>();

export function onSceneChange(fn: Listener) {
  listeners.add(fn);
  fn(sceneState.index);
  return () => {
    listeners.delete(fn);
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function measureScenes() {
  const vh = window.innerHeight;
  const centre = vh * 0.5;
  let index = 0;
  let height = 1;
  let top = 0;

  for (let i = 0; i < SCENES.length; i++) {
    const el = document.getElementById(SCENES[i].id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (SCENES[i].id === 'manifesto') sceneState.aboutTop = r.top;
    if (SCENES[i].id === 'contact') sceneState.contactTop = r.top;
    if (r.top <= centre) {
      index = i;
      top = r.top;
      height = Math.max(1, r.height);
    }
  }
  const d = centre - top;
  sceneState.local = clamp01(d / height);

  const k = SCENES[index].shapes;
  const base = BASE[index];
  const last = index >= SCENES.length - 1;

  // 1. Morph into the next chapter across the last stretch of this one
  const windowPx = Math.min(vh * 0.85, height * 0.5);
  const raw = (d - (height - windowPx)) / windowPx;

  if (!last && raw > 0) {
    sceneState.from = base + k - 1;
    sceneState.to = BASE[index + 1];
    sceneState.mix = smooth(clamp01(raw));
  } else if (k > 1) {
    // 2. Step through this chapter's shapes in time with its pinned text beats,
    //    using the same progress measure as the sticky stage (start start → end end)
    const q = clamp01((d - centre) / Math.max(1, height - vh));
    const w = 0.07;
    sceneState.from = base + k - 1;
    sceneState.to = base + k - 1;
    sceneState.mix = 0;
    for (let j = 1; j < k; j++) {
      const b = j / k;
      if (q < b + w) {
        sceneState.from = base + j - 1;
        sceneState.to = base + j;
        sceneState.mix = smooth(clamp01((q - (b - w)) / (2 * w)));
        break;
      }
    }
  } else {
    sceneState.from = base;
    sceneState.to = base;
    sceneState.mix = 0;
  }

  const max = document.documentElement.scrollHeight - vh;
  sceneState.page = max > 0 ? clamp01(window.scrollY / max) : 0;

  if (index !== sceneState.index) {
    sceneState.index = index;
    listeners.forEach((fn) => fn(index));
  }
}
