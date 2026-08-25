import { onBeforeUnmount, ref } from "vue";

const DESKTOP_MEDIA = "(min-width: 64rem)";

function readInitial(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia(DESKTOP_MEDIA).matches;
}

export function useIsDesktop() {
  const isDesktop = ref(readInitial());

  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return { isDesktop };
  }

  const mq = window.matchMedia(DESKTOP_MEDIA);

  const onChange = (event: MediaQueryListEvent) => {
    isDesktop.value = event.matches;
  };
  mq.addEventListener("change", onChange);

  onBeforeUnmount(() => {
    mq.removeEventListener("change", onChange);
  });

  return { isDesktop };
}
