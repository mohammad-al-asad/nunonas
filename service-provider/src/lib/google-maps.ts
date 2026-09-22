export type GoogleLatLngLiteral = {
  lat: number;
  lng: number;
};

export type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

export type GoogleMapMouseEvent = {
  latLng?: GoogleLatLng | null;
};

export type GoogleGeocoderResult = {
  formatted_address?: string;
  geometry?: {
    location?: GoogleLatLng;
  };
};

export type GoogleMapInstance = {
  addListener: (
    eventName: string,
    handler: (event: GoogleMapMouseEvent) => void,
  ) => unknown;
  setCenter: (position: GoogleLatLngLiteral) => void;
};

export type GoogleMarkerPosition =
  | GoogleLatLngLiteral
  | GoogleLatLng
  | null
  | undefined;

export type GoogleAdvancedMarkerInstance = {
  addListener: (eventName: string, handler: () => void) => unknown;
  map?: GoogleMapInstance | null;
  position?: GoogleMarkerPosition;
};

type GoogleGeocoderInstance = {
  geocode: (
    request: { address?: string; location?: GoogleLatLngLiteral | GoogleLatLng },
    callback: (results: GoogleGeocoderResult[] | null, status: string) => void,
  ) => void;
};

type GoogleMapsRuntime = {
  Map?: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => GoogleMapInstance;
  marker?: {
    AdvancedMarkerElement?: new (
      options: Record<string, unknown>,
    ) => GoogleAdvancedMarkerInstance;
  };
  Geocoder?: new () => GoogleGeocoderInstance;
  event?: {
    clearInstanceListeners: (instance: object) => void;
  };
  importLibrary?: (libraryName: string) => Promise<Record<string, unknown>>;
};

export type ReadyGoogleMaps = {
  Map: NonNullable<GoogleMapsRuntime["Map"]>;
  AdvancedMarkerElement: NonNullable<
    NonNullable<GoogleMapsRuntime["marker"]>["AdvancedMarkerElement"]
  >;
  Geocoder: NonNullable<GoogleMapsRuntime["Geocoder"]>;
  event?: GoogleMapsRuntime["event"];
};

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsRuntime;
    };
  }
}

const SCRIPT_ID = "provider-google-maps-script";
const READY_TIMEOUT_MS = 15_000;
let loaderPromise: Promise<ReadyGoogleMaps> | null = null;

function constructorFrom(
  runtimeValue: unknown,
  libraryValue: unknown,
): unknown {
  return typeof runtimeValue === "function" ? runtimeValue : libraryValue;
}

async function resolveReadyMaps(): Promise<ReadyGoogleMaps | null> {
  const maps = window.google?.maps;
  if (!maps) return null;

  let mapsLibrary: Record<string, unknown> = {};
  let markerLibrary: Record<string, unknown> = {};
  let geocodingLibrary: Record<string, unknown> = {};
  if (typeof maps.importLibrary === "function") {
    [mapsLibrary, markerLibrary, geocodingLibrary] = await Promise.all([
      maps.importLibrary("maps"),
      maps.importLibrary("marker"),
      maps.importLibrary("geocoding"),
    ]);
  }

  const MapConstructor = constructorFrom(maps.Map, mapsLibrary.Map);
  const AdvancedMarkerConstructor = constructorFrom(
    maps.marker?.AdvancedMarkerElement,
    markerLibrary.AdvancedMarkerElement,
  );
  const GeocoderConstructor = constructorFrom(
    maps.Geocoder,
    geocodingLibrary.Geocoder,
  );
  if (
    typeof MapConstructor !== "function"
    || typeof AdvancedMarkerConstructor !== "function"
    || typeof GeocoderConstructor !== "function"
  ) {
    return null;
  }

  return {
    Map: MapConstructor as ReadyGoogleMaps["Map"],
    AdvancedMarkerElement:
      AdvancedMarkerConstructor as ReadyGoogleMaps["AdvancedMarkerElement"],
    Geocoder: GeocoderConstructor as ReadyGoogleMaps["Geocoder"],
    event: maps.event,
  };
}

export function toGoogleLatLngLiteral(
  position: GoogleMarkerPosition,
): GoogleLatLngLiteral | null {
  if (!position) return null;

  const latitude =
    typeof position.lat === "function" ? position.lat() : position.lat;
  const longitude =
    typeof position.lng === "function" ? position.lng() : position.lng;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { lat: Number(latitude), lng: Number(longitude) };
}

export function loadGoogleMaps(apiKey: string): Promise<ReadyGoogleMaps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is only available in the browser."));
  }
  if (!apiKey.trim()) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is required to load Google Maps."),
    );
  }
  if (loaderPromise) return loaderPromise;

  const pending = new Promise<ReadyGoogleMaps>((resolve, reject) => {
    const startedAt = Date.now();
    let settled = false;
    let checkTimer: ReturnType<typeof setTimeout> | undefined;
    let checking = false;
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const cleanup = () => {
      if (checkTimer) clearTimeout(checkTimer);
      script?.removeEventListener("load", checkReadiness);
      script?.removeEventListener("error", handleScriptError);
    };
    const finish = (maps: ReadyGoogleMaps) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(maps);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const scheduleNextCheck = () => {
      if (Date.now() - startedAt >= READY_TIMEOUT_MS) {
        fail(
          new Error(
            "Google Maps loaded incompletely. Check the API key and enable Maps JavaScript API, Geocoding API, and Marker support.",
          ),
        );
        return;
      }
      checkTimer = setTimeout(checkReadiness, 50);
    };
    async function checkReadiness() {
      if (settled || checking) return;
      checking = true;
      try {
        const readyMaps = await resolveReadyMaps();
        if (readyMaps) {
          finish(readyMaps);
          return;
        }
      } catch (error) {
        fail(
          error instanceof Error
            ? error
            : new Error("Google Maps libraries could not be initialized."),
        );
        return;
      } finally {
        checking = false;
      }
      scheduleNextCheck();
    }
    function handleScriptError() {
      fail(new Error("Google Maps could not be loaded."));
    }

    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&v=weekly`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", checkReadiness);
    script.addEventListener("error", handleScriptError, { once: true });
    void checkReadiness();
  });

  loaderPromise = pending.catch((error) => {
    loaderPromise = null;
    throw error;
  });
  return loaderPromise;
}
