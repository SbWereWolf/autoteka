import { onBeforeUnmount, ref } from "vue";

const DESKTOP_MEDIA = "(min-width: 64rem)";

export function useIsDesktop() {
  const isDesktop = ref(false);

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return { isDesktop };
  }

  const mq = window.matchMedia(DESKTOP_MEDIA);
  isDesktop.value = mq.matches;

  const onChange = (event: MediaQueryListEvent) => {
    isDesktop.value = event.matches;
  };
  mq.addEventListener("change", onChange);

  onBeforeUnmount(() => {
    mq.removeEventListener("change", onChange);
  });

  return { isDesktop };
}
