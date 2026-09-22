import { useQuery } from "@tanstack/react-query";
import { getHomeFeed, getTrendingHotels, listCategories, listMyBookings } from "../customer-api";

export const homeQueryKeys = {
  all: ["home"] as const,
  feed: ["home", "feed"] as const,
  trending: ["home", "trending"] as const,
  categories: ["home", "categories"] as const,
  bookings: ["home", "bookings"] as const,
};

export function useHomeFeedQuery() {
  return useQuery({
    queryKey: homeQueryKeys.feed,
    queryFn: () => getHomeFeed(),
  });
}

export function useTrendingQuery(limit = 12) {
  return useQuery({
    queryKey: [...homeQueryKeys.trending, limit],
    queryFn: () => getTrendingHotels(limit),
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: homeQueryKeys.categories,
    queryFn: () => listCategories(),
  });
}

export function useUpcomingBookingsQuery() {
  return useQuery({
    queryKey: homeQueryKeys.bookings,
    queryFn: () => listMyBookings({ status: "upcoming", limit: 3 }),
    staleTime: 60_000,
  });
}

export function dedupeFeedItems(items: unknown[]) {
  const seen = new Set<string>();
  return items.filter((item: any) => {
    const id = item?.id ?? item?._id;
    if (!id) return false;
    const type = String(item?.service_type ?? item?.entity_type ?? item?.category ?? "experience")
      .trim()
      .toLowerCase();
    const key = `${type}-${id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
