// Offer types a provider can create. Mirrors api/app/domain/promotion_types.py.
// Booking discounts change the booking price in the app; in-venue offers are
// shown with their terms and honoured at the restaurant.

export type OfferTypeValue =
  | "percentage"
  | "fixed_amount"
  | "bogo"
  | "food_percentage"
  | "menu_percentage"
  | "custom";

export type OfferTypeOption = {
  value: OfferTypeValue;
  label: string;
  help: string;
  inVenue: boolean;
  /** "%" for percentage values, "amount" for a money value, null when there is no value. */
  valueKind: "%" | "amount" | null;
  termsRequired: boolean;
};

export const OFFER_TYPES: OfferTypeOption[] = [
  { value: "percentage", label: "Percentage", help: "Takes a percentage off the booking price.", inVenue: false, valueKind: "%", termsRequired: false },
  { value: "fixed_amount", label: "Fixed Amount", help: "Takes a fixed amount off the booking price.", inVenue: false, valueKind: "amount", termsRequired: false },
  { value: "bogo", label: "Buy 1 Get 1", help: "Honoured at your restaurant. Say which items it covers.", inVenue: true, valueKind: null, termsRequired: true },
  { value: "food_percentage", label: "% Off Food", help: "Honoured at your restaurant on food only.", inVenue: true, valueKind: "%", termsRequired: false },
  { value: "menu_percentage", label: "% Off Entire Menu", help: "Honoured at your restaurant on everything on the menu.", inVenue: true, valueKind: "%", termsRequired: false },
  { value: "custom", label: "Custom Offer", help: "Any other deal, described in your own terms.", inVenue: true, valueKind: null, termsRequired: true },
];

export function offerTypesFor(categories: string[]): OfferTypeOption[] {
  // In-venue offers only make sense where customers order food.
  return categories.includes("Restaurant") ? OFFER_TYPES : OFFER_TYPES.filter((type) => !type.inVenue);
}

export function offerTypeOption(value: string): OfferTypeOption {
  return OFFER_TYPES.find((type) => type.value === value) ?? OFFER_TYPES[0];
}

const APPLICABLE_BY_CATEGORY: Array<[string, string]> = [
  ["Restaurant", "Dining Only"],
  ["Hotel", "Hotel Only"],
  ["Spa", "Spa Only"],
  ["Event", "Events Only"],
];

export function applicableOptionsFor(categories: string[]): string[] {
  return ["All Services", ...APPLICABLE_BY_CATEGORY.filter(([category]) => categories.includes(category)).map(([, label]) => label)];
}

export function validateOfferFields(type: OfferTypeOption, value: string, terms: string): string | null {
  if (type.valueKind) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return "Enter a discount above 0.";
    if (type.valueKind === "%" && amount > 100) return "A percentage discount cannot be more than 100%.";
  }
  if (type.termsRequired && !terms.trim()) return "Describe the offer terms so customers know what they get.";
  return null;
}
