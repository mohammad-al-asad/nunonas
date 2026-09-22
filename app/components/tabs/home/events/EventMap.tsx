import React, { useEffect, useMemo, useState } from "react";
import { listEvents } from "../../../../lib/customer-api";
import { normalizeMapEvent } from "../../../../lib/event-map-utils";
import type { CustomerMapEventPayload, CustomerMapEventsResponse, NormalizedMapEvent } from "../../../../lib/event-map-types";
import type { MapFilterKey } from "../../../ui/MapFilterChips";
import type { DiscoveryMapItem } from "../../../../lib/discovery-map";
import DiscoveryMap from "../../../ui/DiscoveryMap";

type Props = { events?: NormalizedMapEvent[]; loading?: boolean; activeFilters?: MapFilterKey[] };
export default function EventMap({ events: suppliedEvents, loading: suppliedLoading = false, activeFilters = ["near-me"] }: Props = {}) {
  const [fetchedEvents, setFetchedEvents] = useState<NormalizedMapEvent[]>([]);
  const [loading, setLoading] = useState(suppliedEvents == null);
  useEffect(() => {
    if (suppliedEvents) return;
    let cancelled = false;
    void listEvents<CustomerMapEventsResponse>({ limit: 100 }).then((payload) => {
      if (cancelled) return;
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setFetchedEvents(items.map((item: CustomerMapEventPayload) => normalizeMapEvent(item)).filter((event) => event.entityType === "event"));
    }).catch(() => { if (!cancelled) setFetchedEvents([]); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [suppliedEvents]);
  const events = suppliedEvents ?? fetchedEvents;
  const items = useMemo<DiscoveryMapItem[]>(() => events.flatMap((event) => {
    return [{ id: String(event.id), title: event.title, kind: "event", latitude: event.latitude, longitude: event.longitude, location: event.location, rating: event.rating, isOpenNow: event.isOpenNow, hasOffer: Boolean(event.offerText), nearMetro: /\b(metro|station|subway|rail)\b/i.test(`${event.venue} ${event.address} ${event.location}`), detailRoute: `/home/events/${event.id}` }];
  }), [events]);
  return <DiscoveryMap items={items} loading={suppliedEvents ? suppliedLoading : loading} filters={activeFilters} />;
}
