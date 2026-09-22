import { describe, expect, it } from "vitest";
import { buildOnboardingProfilePayload } from "./vendor-contracts";

describe("vendor API payload contracts", () => {
  it("maps onboarding identity fields without including business settings", () => {
    expect(buildOnboardingProfilePayload({
      business_name: " Nuno Hotel ",
      owner_full_name: " Miskat Rahman ",
      phone: " +8801000000000 ",
      email: " owner@example.com ",
    }, ["hotel"])).toEqual({
      business_name: "Nuno Hotel",
      category: "Hotel",
      categories: ["Hotel"],
      owner_full_name: "Miskat Rahman",
      email_address: "owner@example.com",
      phone_number: "+8801000000000",
    });
  });
});
