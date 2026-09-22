export const EVENT_CATEGORY_OPTIONS = [
  "Music",
  "Nightlife",
  "Comedy",
  "Family",
  "Culture",
  "Sports",
] as const;

export type EventDiscoveryCategory =
  (typeof EVENT_CATEGORY_OPTIONS)[number];

const CATEGORY_KEYWORDS: Array<{
  category: EventDiscoveryCategory;
  keywords: readonly string[];
}> = [
  {
    category: "Comedy",
    keywords: ["comedy", "comedian", "stand-up", "standup"],
  },
  {
    category: "Family",
    keywords: ["family", "kids", "children", "child", "birthday", "wedding"],
  },
  {
    category: "Sports",
    keywords: [
      "sport",
      "football",
      "soccer",
      "cricket",
      "basketball",
      "tennis",
      "fitness",
      "wellness",
      "race",
      "marathon",
      "tournament",
    ],
  },
  {
    category: "Music",
    keywords: [
      "music",
      "concert",
      "festival",
      "band",
      "singer",
      "live performance",
      "dj",
    ],
  },
  {
    category: "Nightlife",
    keywords: [
      "nightlife",
      "night club",
      "nightclub",
      "club",
      "party",
      "lounge",
      "bar",
      "gala",
      "dinner",
      "late session",
    ],
  },
  {
    category: "Culture",
    keywords: [
      "culture",
      "cultural",
      "art",
      "exhibition",
      "museum",
      "theatre",
      "theater",
      "heritage",
      "workshop",
      "conference",
      "tasting",
    ],
  },
];

export function normalizeEventCategory(
  value: unknown,
): EventDiscoveryCategory {
  const normalized = String(value ?? "").trim().toLowerCase();
  const exact = EVENT_CATEGORY_OPTIONS.find(
    (category) => category.toLowerCase() === normalized,
  );
  if (exact) return exact;

  return (
    CATEGORY_KEYWORDS.find(({ keywords }) =>
      keywords.some((keyword) => normalized.includes(keyword)),
    )?.category ?? "Culture"
  );
}
