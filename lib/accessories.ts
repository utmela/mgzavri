export const ACCESSORIES = [
  { id: "skis",    icon: "🎿", en: "Skis / Snowboard", ka: "სათხილამურო" },
  { id: "luggage", icon: "🧳", en: "Large Luggage",     ka: "დიდი ბარგი"  },
  { id: "pets",    icon: "🐾", en: "Pets",              ka: "შინაური ცხოველი" },
] as const;

export type AccessoryId = (typeof ACCESSORIES)[number]["id"];

export function getAccessory(id: string) {
  return ACCESSORIES.find(a => a.id === id);
}