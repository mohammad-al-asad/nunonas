import { useWindowDimensions } from "react-native";

// Horizontal space between tiles, as a percentage of the row width.
const GAP_PERCENT = 2.75;

/** Column count for small tile grids (e.g. amenities): 3 on phones, more on tablets / landscape. */
export function columnsForWidth(width: number): number {
  if (width < 600) return 3;
  if (width < 900) return 4;
  if (width < 1200) return 5;
  return 6;
}

/**
 * Responsive grid sizing. Use with a row that wraps and has
 * `justifyContent: "space-between"`; render `fillerCount(items.length)`
 * invisible tiles so a short last row stays aligned to the columns.
 */
export function useGridColumns() {
  const { width } = useWindowDimensions();
  const columns = columnsForWidth(width);
  return {
    columns,
    itemWidth: `${(100 - GAP_PERCENT * (columns - 1)) / columns}%` as `${number}%`,
    fillerCount: (itemCount: number) => (columns - (itemCount % columns)) % columns,
  };
}
