import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { VendorCategory } from "../../lib/vendor-access";

type ProviderState = {
  categories: VendorCategory[];
  categoriesLoaded: boolean;
};

const initialState: ProviderState = {
  categories: ["Restaurant"],
  categoriesLoaded: false,
};

const providerSlice = createSlice({
  name: "provider",
  initialState,
  reducers: {
    setProviderCategories(state, action: PayloadAction<VendorCategory[]>) {
      state.categories = action.payload;
      state.categoriesLoaded = true;
    },
    resetProviderState() {
      return initialState;
    },
  },
});

export const { resetProviderState, setProviderCategories } =
  providerSlice.actions;

export default providerSlice.reducer;
