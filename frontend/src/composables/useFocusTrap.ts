import { nextTick, onBeforeUnmount, watch, type Ref } from "vue";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export type FocusTrapOptions = {
  open: Ref<boolean>;
  dialogRef: Ref<HTMLElement | null>;
  onClose: () => void;
  fallbackSelector?: string;
};

export function useFocusTrap(options: FocusTrapOptions): void {
  const { open, dialogRef, onClose, fallbackSelector } = options;
  let prevFocused: HTMLElement | null = null;
  let listening = false;

  function focusables(dialog: HTMLElement): HTMLElement[] {
    return Array.from(
      dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
  }

  function onKeydown(event: KeyboardEvent) {
    if (!open.value) return;
    const dialog = dialogRef.value;
    if (!dialog) return;

    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const items = focusables(dialog);
    if (items.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (active instanceof HTMLElement && !dialog.contains(active)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function activate() {
    const dialog = dialogRef.value;
    if (!dialog) return;
    prevFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!listening) {
      document.addEventListener("keydown", onKeydown);
      listening = true;
    }
    const items = focusables(dialog);
    (items[0] ?? dialog).focus();
  }

  function deactivate() {
    if (listening) {
      document.removeEventListener("keydown", onKeydown);
      listening = false;
    }

    const fallback = fallbackSelector
      ? document.querySelector<HTMLElement>(fallbackSelector)
      : null;
    const target =
      prevFocused && prevFocused.isConnected ? prevFocused : fallback;
    target?.focus();
    prevFocused = null;
  }

  watch(open, async (next, prev) => {
    if (next === prev) return;
    await nextTick();
    if (next) {
      activate();
    } else {
      deactivate();
    }
  });

  onBeforeUnmount(() => {
    if (listening) {
      document.removeEventListener("keydown", onKeydown);
      listening = false;
    }
  });
}
