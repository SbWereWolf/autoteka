import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./styles/tailwind.css";
import "./styles/themes.css";
import "./styles/pattern.css";

// Hover polyfill for DevTools Responsive / touch emulation:
// Some emulations report pointerType=touch and disable CSS :hover even when a mouse is used.
// We drive hover via `.is-hover` class on `.ui-interactive/.ui-link/.ui-tile` using mousemove.
function setupHoverPolyfill() {
  const root = document.documentElement;
  let last: HTMLElement | null = null;

  function findInteractive(node: Element | null): HTMLElement | null {
    return (node as HTMLElement | null)?.closest?.(".ui-interactive, .ui-link, .ui-tile") as HTMLElement | null;
  }

  function setHoverAt(x: number, y: number) {
    root.classList.add("has-mouse");
    const el = findInteractive(document.elementFromPoint(x, y));
    if (el === last) return;
    last?.classList.remove("is-hover");
    el?.classList.add("is-hover");
    last = el;
  }

  // mousemove is the most reliable signal that a real mouse is present
  document.addEventListener(
    "mousemove",
    (e) => setHoverAt(e.clientX, e.clientY),
    { passive: true, capture: true }
  );

  // Some emulations suppress mousemove and only emit pointermove; treat buttons===0 as hover-like.
  document.addEventListener(
    "pointermove",
    (e) => {
      if ((e as PointerEvent).buttons !== 0) return;
      setHoverAt((e as PointerEvent).clientX, (e as PointerEvent).clientY);
    },
    { passive: true, capture: true }
  );

  window.addEventListener(
    "mouseleave",
    () => {
      last?.classList.remove("is-hover");
      last = null;
    },
    { passive: true }
  );

  // On touch/pen interactions, drop hover so it doesn't "stick".
  window.addEventListener(
    "pointerdown",
    () => {
      last?.classList.remove("is-hover");
      last = null;
    },
    { passive: true }
  );

  // On scroll, recalc hover target (prevents "stuck" hover)
  window.addEventListener(
    "scroll",
    () => {
      if (!last) return;
      last.classList.remove("is-hover");
      last = null;
    },
    { passive: true }
  );
}

setupHoverPolyfill();

createApp(App).use(router).mount("#app");
