import { describe, expect, it } from "vitest";
import { formatApiError } from "./api-error";

describe("formatApiError", () => {
  it("formats FastAPI validation details with the affected field", () => {
    expect(
      formatApiError(
        {
          detail: [
            {
              loc: ["body", "registration_deadline"],
              msg: "Input should be a valid datetime",
            },
          ],
        },
        422,
      ),
    ).toBe("registration_deadline: Input should be a valid datetime");
  });

  it("preserves a normal API detail message", () => {
    expect(formatApiError({ detail: "Event category is not allowed." }, 422)).toBe(
      "Event category is not allowed.",
    );
  });

  it("provides a status-aware fallback", () => {
    expect(formatApiError({}, 500)).toBe("Request failed (500)");
  });

  it("shows proxy errors returned by the service-provider API route", () => {
    expect(formatApiError({ error: "Backend unavailable" }, 502)).toBe(
      "Backend unavailable",
    );
  });
});
