import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type DiscoveryCategory = "all" | "restaurant" | "hotel" | "spa" | "event" | "happy_hour";
export type DiscoveryView = "list" | "map";

type DiscoveryState = {
  category: DiscoveryCategory;
  view: DiscoveryView;
  filters: string[];
  selectedId: string | null;
};

const initialState: DiscoveryState = {
  category: "all",
  view: "list",
  filters: [],
  selectedId: null,
};

const discoverySlice = createSlice({
  name: "discovery",
  initialState,
  reducers: {
    categoryChanged(state, action: PayloadAction<DiscoveryCategory>) {
      state.category = action.payload;
      state.selectedId = null;
    },
    viewChanged(state, action: PayloadAction<DiscoveryView>) {
      state.view = action.payload;
    },
    filtersChanged(state, action: PayloadAction<string[]>) {
      state.filters = action.payload;
    },
    selectedItemChanged(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    discoveryReset() {
      return initialState;
    },
  },
});

export const {
  categoryChanged,
  viewChanged,
  filtersChanged,
  selectedItemChanged,
  discoveryReset,
} = discoverySlice.actions;

export default discoverySlice.reducer;
