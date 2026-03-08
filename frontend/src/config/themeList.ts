export type ThemeItem = {
  id: string;
  label: string;
  icon: string;
};

export const themeList: ThemeItem[] = [
  { id: "a-neutral", label: "A Neutral", icon: "A" },
  { id: "a-accent", label: "A Accent", icon: "A+" },
  { id: "b-neutral", label: "B Neutral", icon: "B" },
  { id: "b-accent", label: "B Accent", icon: "B+" },
  { id: "c-neutral", label: "C Neutral", icon: "C" },
  { id: "c-accent", label: "C Accent", icon: "C+" },
];
