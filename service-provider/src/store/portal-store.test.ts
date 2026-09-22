import { describe, expect, it } from "vitest";
import { makePortalStore } from "./portal-store";
import {
  closeMobileNavigation,
  openMobileNavigation,
  setNotificationsOpen,
} from "./slices/portal-ui-slice";
import { setProviderCategories } from "./slices/provider-slice";

describe("portal Redux store", () => {
  it("manages shared dashboard overlays", () => {
    const store = makePortalStore();

    store.dispatch(openMobileNavigation());
    store.dispatch(setNotificationsOpen(true));
    expect(store.getState().portalUi).toEqual({
      mobileNavigationOpen: true,
      notificationsOpen: true,
    });

    store.dispatch(closeMobileNavigation());
    expect(store.getState().portalUi.mobileNavigationOpen).toBe(false);
  });

  it("stores enabled provider categories globally", () => {
    const store = makePortalStore();

    store.dispatch(setProviderCategories(["Hotel", "Spa"]));

    expect(store.getState().provider).toEqual({
      categories: ["Hotel", "Spa"],
      categoriesLoaded: true,
    });
  });
});
