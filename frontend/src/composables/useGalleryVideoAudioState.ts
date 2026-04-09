import { ref } from "vue";

const isGalleryVideoMuted = ref(true);

export function useGalleryVideoAudioState() {
  return {
    isGalleryVideoMuted,
  };
}
