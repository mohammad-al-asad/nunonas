import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

type LocationState = {
  coords: UserLocation | null;
  address: string;
  loading: boolean;
  permissionEnabled: boolean;
  lastUpdatedAt: number | null;
};

const initialState: LocationState = {
  coords: null,
  address: "Select location",
  loading: false,
  permissionEnabled: false,
  lastUpdatedAt: null,
};

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    locationLoadingChanged(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    locationUpdated(state, action: PayloadAction<{ coords: UserLocation; address?: string }>) {
      state.coords = action.payload.coords;
      if (action.payload.address) state.address = action.payload.address;
      state.permissionEnabled = true;
      state.loading = false;
      state.lastUpdatedAt = Date.now();
    },
    addressUpdated(state, action: PayloadAction<string>) {
      state.address = action.payload || "Select location";
    },
    locationReset(state) {
      state.coords = null;
      state.address = "Select location";
      state.permissionEnabled = false;
      state.lastUpdatedAt = null;
    },
  },
});

export const {
  locationLoadingChanged,
  locationUpdated,
  addressUpdated,
  locationReset,
} = locationSlice.actions;

export default locationSlice.reducer;
