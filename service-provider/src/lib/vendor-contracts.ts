import { extractVendorCategories } from "./vendor-access";

export type OnboardingProfileDraft = {
  business_name: string;
  owner_full_name: string;
  phone: string;
  email: string;
};

export function buildOnboardingProfilePayload(
  draft: OnboardingProfileDraft,
  categoryInput: unknown,
): Record<string, unknown> {
  const categories = extractVendorCategories(categoryInput);
  return {
    business_name: draft.business_name.trim(),
    category: categories[0] ?? "Restaurant",
    categories,
    owner_full_name: draft.owner_full_name.trim(),
    email_address: draft.email.trim(),
    phone_number: draft.phone.trim(),
  };
}
