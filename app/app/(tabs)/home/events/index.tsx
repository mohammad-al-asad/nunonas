import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../../../constants/theme";
import { listEvents } from "../../../../lib/customer-api";
import { getErrorMessage, normalizeMapEvent } from "../../../../lib/event-map-utils";
import type { CustomerMapEventPayload, CustomerMapEventsResponse, NormalizedMapEvent } from "../../../../lib/event-map-types";

import EventSearchBar from "../../../../components/tabs/home/events/EventSearchBar";
import EventFilterToggle from "../../../../components/tabs/home/events/EventFilterToggle";
import CategoryFilters from "../../../../components/tabs/home/events/CategoryFilters";
import EventCard from "../../../../components/tabs/home/events/EventCard";
import EventMap from "../../../../components/tabs/home/events/EventMap";
import MapFilterChips, { toggleMapFilter, type MapFilterKey } from "../../../../components/ui/MapFilterChips";

const EVENT_CATEGORIES = [
  "All",
  "Music",
  "Nightlife",
  "Comedy",
  "Family",
  "Culture",
  "Sports",
] as const;

type EventCategory = (typeof EVENT_CATEGORIES)[number];

const EVENT_CATEGORY_KEYWORDS: Record<
  Exclude<EventCategory, "All">,
  readonly string[]
> = {
  Music: [
    "music",
    "concert",
    "festival",
    "band",
    "singer",
    "live performance",
    "dj",
  ],
  Nightlife: [
    "nightlife",
    "night club",
    "nightclub",
    "club",
    "party",
    "lounge",
    "bar",
    "gala",
  ],
  Comedy: ["comedy", "comedian", "stand-up", "standup"],
  Family: [
    "family",
    "kids",
    "children",
    "child",
    "birthday",
    "wedding",
  ],
  Culture: [
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
  ],
  Sports: [
    "sport",
    "football",
    "soccer",
    "cricket",
    "basketball",
    "tennis",
    "fitness",
    "race",
    "marathon",
    "tournament",
  ],
};

function matchesEventCategory(
  event: NormalizedMapEvent,
  category: EventCategory,
): boolean {
  if (category === "All") return true;

  const searchableText = [
    event.eventType,
    event.tag,
    event.title,
    event.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

  return EVENT_CATEGORY_KEYWORDS[category].some((keyword) =>
    searchableText.includes(keyword),
  );
}

export default function EventsScreen() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"List" | "Map">("List");
  const [activeCategory, setActiveCategory] =
    useState<EventCategory>("All");
  const [mapFilters, setMapFilters] = useState<MapFilterKey[]>(["near-me"]);
  const [events, setEvents] = useState<NormalizedMapEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        setLoading(true);
        setError("");
        const payload = await listEvents<CustomerMapEventsResponse>({
          limit: 50,
          search: searchQuery || undefined,
        });
        if (cancelled) {
          return;
        }
        const items = Array.isArray(payload?.items) ? payload.items : [];
        setEvents(items.map((item: CustomerMapEventPayload) => normalizeMapEvent(item)));
      } catch (error: unknown) {
        if (!cancelled) {
          setEvents([]);
          setError(getErrorMessage(error, "Could not load events."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timeout = setTimeout(loadEvents, searchQuery ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  const handleTabChange = (nextTab: "List" | "Map") => {
    setActiveTab(nextTab);
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) =>
      matchesEventCategory(event, activeCategory),
    );
  }, [activeCategory, events]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <EventSearchBar value={searchQuery} onChangeText={setSearchQuery} />
        {activeTab === "Map" ? (
          <View style={styles.mapFilters}>
            <MapFilterChips
              active={mapFilters}
              locked={["near-me"]}
              onToggle={(filter) =>
                setMapFilters((current) => toggleMapFilter(current, filter))
              }
            />
          </View>
        ) : null}
        <EventFilterToggle
          eventCount={filteredEvents.length}
          activeTab={activeTab}
          onChangeTab={handleTabChange}
        />
        <CategoryFilters
          categories={[...EVENT_CATEGORIES]}
          activeCategory={activeCategory}
          onSelectCategory={(category) =>
            setActiveCategory(category as EventCategory)
          }
        />

        {activeTab === "Map" ? <EventMap events={filteredEvents} loading={loading} activeFilters={mapFilters} /> : <View style={styles.list}>
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={theme.COLORS.primary} />
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={styles.messageText}>{error}</Text>
            </View>
          ) : filteredEvents.length ? (
            filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <View style={styles.centerState}>
              <Text style={styles.messageText}>No events matched your search.</Text>
            </View>
          )}
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.white,
  },
  list: {
    paddingTop: 5,
    paddingBottom: 20,
  },
  mapFilters: {
    marginTop: 12,
  },
  centerState: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  messageText: {
    color: theme.COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});


