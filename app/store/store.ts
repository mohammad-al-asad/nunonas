import { configureStore } from "@reduxjs/toolkit";
import locationReducer from "./slices/locationSlice";
import discoveryReducer from "./slices/discoverySlice";
import savedReducer from "./slices/savedSlice";

export const store = configureStore({
  reducer: {
    location: locationReducer,
    discovery: discoveryReducer,
    saved: savedReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
