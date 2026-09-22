import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SavedKey = `${string}:${string}`;

export function savedKey(entityType: string, entityId: string | number): SavedKey {
  return `${String(entityType).toLowerCase()}:${String(entityId)}` as SavedKey;
}

type SavedState = { keys: Record<string, true>; hydrated: boolean };

const initialState: SavedState = { keys: {}, hydrated: false };

const savedSlice = createSlice({
  name: "saved",
  initialState,
  reducers: {
    hydrateSavedItems: (state, action: PayloadAction<Array<{ entity_type?: string; entity_id?: string }>>) => {
      state.keys = {};
      for (const item of action.payload) {
        if (item.entity_type && item.entity_id) state.keys[savedKey(item.entity_type, item.entity_id)] = true;
      }
      state.hydrated = true;
    },
    markSaved: (state, action: PayloadAction<{ entityType: string; entityId: string }>) => {
      state.keys[savedKey(action.payload.entityType, action.payload.entityId)] = true;
    },
    markUnsaved: (state, action: PayloadAction<{ entityType: string; entityId: string }>) => {
      delete state.keys[savedKey(action.payload.entityType, action.payload.entityId)];
    },
  },
});

export const { hydrateSavedItems, markSaved, markUnsaved } = savedSlice.actions;
export default savedSlice.reducer;
