import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./styles/tailwind.css";
import "./styles/themes.css";
import "./styles/pattern.css";

// Some device emulations disable CSS :hover even when using a mouse.
// This lightweight polyfill adds `.has-mouse` on mouse pointer movement and
// toggles `.is-hover` on elements marked as `.ui-interactive` / `.ui-link`.
function setupHoverPolyfill() {
  const root = document.documentElement;
  let hasMouse = false;

  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "mouse" && !hasMouse) {
        hasMouse = true;
        root.classList.add("has-mouse");
      }
    },
    { passive: true }
  );

  document.addEventListener(
    "pointerover",
    (e) => {
      const pe = e as PointerEvent;
      if (pe.pointerType !== "mouse") return;
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>(".ui-interactive, .ui-link, .ui-tile");
      if (!el) return;
      el.classList.add("is-hover");
    },
    { passive: true }
  );

  document.addEventListener(
    "pointerout",
    (e) => {
      const pe = e as PointerEvent;
      if (pe.pointerType !== "mouse") return;
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>(".ui-interactive, .ui-link, .ui-tile");
      if (!el) return;
      const related = (e as any).relatedTarget as Node | null;
      if (related && el.contains(related)) return;
      el.classList.remove("is-hover");
    },
    { passive: true }
  );
}

setupHoverPolyfill();

createApp(App).use(router).mount("#app");
