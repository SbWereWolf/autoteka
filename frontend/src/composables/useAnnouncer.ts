import { ref } from "vue";

const message = ref("");

function announce(text: string) {
  message.value = "";
  if (
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
  ) {
    window.requestAnimationFrame(() => {
      message.value = text;
    });
    return;
  }

  message.value = text;
}

export function useAnnouncer() {
  return { message, announce };
}
