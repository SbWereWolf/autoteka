import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./styles/tailwind.css";
import "./styles/themes.css";
import "./styles/pattern.css";

/**
 * Some browsers (especially in responsive/device emulation) disable CSS :hover.
 * Requirement: clickable elements must react to the mouse on all breakpoints.
 *
 * We add/remove .is-hover on elements with .ui-interactive using mouseover/mouseout.
 */
function installHoverPolyfill() {
  const getInteractive = (t: EventTarget | null): HTMLElement | null => {
    if (!t || !(t instanceof HTMLElement)) return null;
    return t.closest(".ui-interactive");
  };

  let last: HTMLElement | null = null;
  const setHover = (el: HTMLElement | null) => {
    if (el === last) return;
    if (last) last.classList.remove("is-hover");
    last = el;
    if (last) last.classList.add("is-hover");
  };

  // Mouse events (normal desktops)
  document.addEventListener("mouseover", (e: MouseEvent) => {
    setHover(getInteractive(e.target));
  });
  document.addEventListener("mouseout", (e: MouseEvent) => {
    const el = getInteractive(e.relatedTarget);
    if (el) setHover(el);
    else setHover(null);
  });

  // Pointer events (works better in device emulation where mouseover can be suppressed)
  document.addEventListener(
    "pointermove",
    (e: PointerEvent) => {
      // In responsive emulation, pointerType can be inconsistent; still treat it as hover.
      // This is intentionally permissive to satisfy: "react to mouse on small breakpoints".
      setHover(getInteractive(e.target));
    },
    { passive: true }
  );

  document.addEventListener(
    "pointerleave",
    () => {
      setHover(null);
    },
    { passive: true }
  );
}

installHoverPolyfill();

createApp(App).use(router).mount("#app");
