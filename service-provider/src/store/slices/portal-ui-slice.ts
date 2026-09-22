import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type PortalUiState = {
  mobileNavigationOpen: boolean;
  notificationsOpen: boolean;
};

const initialState: PortalUiState = {
  mobileNavigationOpen: false,
  notificationsOpen: false,
};

const portalUiSlice = createSlice({
  name: "portalUi",
  initialState,
  reducers: {
    openMobileNavigation(state) {
      state.mobileNavigationOpen = true;
    },
    closeMobileNavigation(state) {
      state.mobileNavigationOpen = false;
    },
    setNotificationsOpen(state, action: PayloadAction<boolean>) {
      state.notificationsOpen = action.payload;
    },
    closePortalOverlays(state) {
      state.mobileNavigationOpen = false;
      state.notificationsOpen = false;
    },
  },
});

export const {
  closeMobileNavigation,
  closePortalOverlays,
  openMobileNavigation,
  setNotificationsOpen,
} = portalUiSlice.actions;

export default portalUiSlice.reducer;
