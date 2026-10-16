export type Lang = "en" | "ka";

export type City = {
  name: string;
  ka: string;
  slug: string;
  image: string;
  aliases?: string[];
};

const fallbackImage = "/cities/images.jpg";

export const CITIES: City[] = [
  { name: "Tbilisi", ka: "თბილისი", slug: "tbilisi", image: "/cities/tbilisi.jpg" },
  { name: "Kutaisi", ka: "ქუთაისი", slug: "kutaisi", image: "/cities/kutaisi.jpg" },
  { name: "Batumi", ka: "ბათუმი", slug: "batumi", image: "/cities/batumi.jpg" },
  { name: "Rustavi", ka: "რუსთავი", slug: "rustavi", image: fallbackImage },
  { name: "Gori", ka: "გორი", slug: "gori", image: "/cities/gori.jpg" },
  { name: "Zugdidi", ka: "ზუგდიდი", slug: "zugdidi", image: "/cities/zugdidi.jpg" },
  { name: "Poti", ka: "ფოთი", slug: "poti", image: fallbackImage },
  { name: "Samtredia", ka: "სამტრედია", slug: "samtredia", image: "/cities/samtredia.jpg" },
  { name: "Senaki", ka: "სენაკი", slug: "senaki", image: fallbackImage },
  { name: "Kobuleti", ka: "ქობულეთი", slug: "kobuleti", image: "/cities/kobuleti.jpg" },
  { name: "Ozurgeti", ka: "ოზურგეთი", slug: "ozurgeti", image: fallbackImage },
  { name: "Telavi", ka: "თელავი", slug: "telavi", image: "/cities/telavi.jpg" },
  { name: "Mtskheta", ka: "მცხეთა", slug: "mtskheta", image: fallbackImage },
  { name: "Borjomi", ka: "ბორჯომი", slug: "borjomi", image: "/cities/borjomi.jpg" },
  { name: "Akhaltsikhe", ka: "ახალციხე", slug: "akhaltsikhe", image: fallbackImage },
  { name: "Akhalkalaki", ka: "ახალქალაქი", slug: "akhalkalaki", image: fallbackImage },
  { name: "Marneuli", ka: "მარნეული", slug: "marneuli", image: fallbackImage },
  { name: "Bolnisi", ka: "ბოლნისი", slug: "bolnisi", image: fallbackImage },
  { name: "Gardabani", ka: "გარდაბანი", slug: "gardabani", image: fallbackImage },
  { name: "Sagarejo", ka: "საგარეჯო", slug: "sagarejo", image: fallbackImage },
  { name: "Sighnaghi", ka: "სიღნაღი", slug: "sighnaghi", image: fallbackImage },
  { name: "Lagodekhi", ka: "ლაგოდეხი", slug: "lagodekhi", image: fallbackImage },
  { name: "Dedoplistskaro", ka: "დედოფლისწყარო", slug: "dedoplistskaro", image: fallbackImage },
  { name: "Kaspi", ka: "კასპი", slug: "kaspi", image: fallbackImage },
  { name: "Kareli", ka: "ქარელი", slug: "kareli", image: fallbackImage },
  { name: "Khashuri", ka: "ხაშური", slug: "khashuri", image: fallbackImage },
  { name: "Surami", ka: "სურამი", slug: "surami", image: fallbackImage },
  { name: "Zestafoni", ka: "ზესტაფონი", slug: "zestafoni", image: fallbackImage },
  { name: "Tkibuli", ka: "ტყიბული", slug: "tkibuli", image: fallbackImage },
  { name: "Chiatura", ka: "ჭიათურა", slug: "chiatura", image: fallbackImage },
  { name: "Tskaltubo", ka: "წყალტუბო", slug: "tskaltubo", image: fallbackImage },
  { name: "Lanchkhuti", ka: "ლანჩხუთი", slug: "lanchkhuti", image: fallbackImage },
  { name: "Khobi", ka: "ხობი", slug: "khobi", image: fallbackImage },
  { name: "Abasha", ka: "აბაშა", slug: "abasha", image: fallbackImage },
  { name: "Tsalenjikha", ka: "წალენჯიხა", slug: "tsalenjikha", image: fallbackImage },
  { name: "Martvili", ka: "მარტვილი", slug: "martvili", image: fallbackImage },
  { name: "Khoni", ka: "ხონი", slug: "khoni", image: fallbackImage },
  { name: "Vani", ka: "ვანი", slug: "vani", image: fallbackImage },
  { name: "Baghdati", ka: "ბაღდათი", slug: "baghdati", image: fallbackImage },
  { name: "Terjola", ka: "თერჯოლა", slug: "terjola", image: fallbackImage },
  { name: "Ambrolauri", ka: "ამბროლაური", slug: "ambrolauri", image: fallbackImage },
  { name: "Oni", ka: "ონი", slug: "oni", image: fallbackImage },
  { name: "Tsageri", ka: "ცაგერი", slug: "tsageri", image: fallbackImage },
  { name: "Dusheti", ka: "დუშეთი", slug: "dusheti", image: fallbackImage },
  { name: "Tianeti", ka: "თიანეთი", slug: "tianeti", image: fallbackImage },
  { name: "Ninotsminda", ka: "ნინოწმინდა", slug: "ninotsminda", image: fallbackImage },
  { name: "Adigeni", ka: "ადიგენი", slug: "adigeni", image: fallbackImage },
  { name: "Aspindza", ka: "ასპინძა", slug: "aspindza", image: fallbackImage },
  { name: "Khulo", ka: "ხულო", slug: "khulo", image: fallbackImage },
  { name: "Shuakhevi", ka: "შუახევი", slug: "shuakhevi", image: fallbackImage },
  { name: "Bakuriani", ka: "ბაკურიანი", slug: "bakuriani", image: "/cities/bakuriani.jpg" },
  { name: "Gudauri", ka: "გუდაური", slug: "gudauri", image: "/cities/gudauri.jpg" },
  { name: "Mestia", ka: "მესტია", slug: "mestia", image: "/cities/mestia.jpg" },
  { name: "Stepantsminda", ka: "სტეფანწმინდა", slug: "kazbegi", aliases: ["stepantsminda"], image: fallbackImage },
  { name: "Svaneti", ka: "სვანეთი", slug: "svaneti", image: fallbackImage },
  { name: "Ushguli", ka: "უშგული", slug: "ushguli", image: fallbackImage },
  { name: "Kvareli", ka: "ყვარელი", slug: "kvareli", image: fallbackImage },
  { name: "Tusheti", ka: "თუშეთი", slug: "tusheti", image: fallbackImage },
];

export const POPULAR_ROUTES = [
  { from: "Tbilisi", to: "Batumi", duration: "5h 30m" },
  { from: "Tbilisi", to: "Kutaisi", duration: "3h 30m" },
  { from: "Tbilisi", to: "Stepantsminda", duration: "3h" },
  { from: "Tbilisi", to: "Gudauri", duration: "2h 15m" },
  { from: "Kutaisi", to: "Batumi", duration: "2h 30m" },
  { from: "Kutaisi", to: "Mestia", duration: "5h" },
] as const;

export function cityLabel(name: string, lang: Lang) {
  const city = CITIES.find((item) => item.name === name);
  return city ? (lang === "ka" ? city.ka : city.name) : name;
}

export function cityImage(name: string) {
  return CITIES.find((item) => item.name === name)?.image ?? fallbackImage;
}

export function cityFromSlug(slug: string) {
  const normalized = slug.toLowerCase();
  return CITIES.find((item) => item.slug === normalized || item.aliases?.includes(normalized));
}

export function citySlug(name: string) {
  return CITIES.find((item) => item.name === name)?.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function routeSlug(from: string, to: string) {
  return `${citySlug(from)}-${citySlug(to)}`;
}

export function parseRouteSlug(value: string) {
  for (const from of CITIES) {
    const candidates = [from.slug, ...(from.aliases ?? [])];
    for (const fromSlug of candidates) {
      const prefix = `${fromSlug}-`;
      if (!value.startsWith(prefix)) continue;
      const to = cityFromSlug(value.slice(prefix.length));
      if (to) return { from, to };
    }
  }
  return null;
}

export function cityOptions(lang: Lang) {
  return CITIES.map((city) => ({ value: city.name, label: lang === "ka" ? city.ka : city.name }));
}
