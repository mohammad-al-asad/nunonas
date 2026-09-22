import { configureStore } from "@reduxjs/toolkit";
import portalUiReducer from "./slices/portal-ui-slice";
import providerReducer from "./slices/provider-slice";

export function makePortalStore() {
  return configureStore({
    reducer: {
      portalUi: portalUiReducer,
      provider: providerReducer,
    },
  });
}

export type PortalStore = ReturnType<typeof makePortalStore>;
export type RootState = ReturnType<PortalStore["getState"]>;
export type AppDispatch = PortalStore["dispatch"];
