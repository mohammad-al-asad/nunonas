type ApiValidationIssue = {
  loc?: unknown;
  msg?: unknown;
  message?: unknown;
};

function formatValidationIssue(issue: unknown): string {
  if (typeof issue === "string") return issue;
  if (!issue || typeof issue !== "object") return "";

  const value = issue as ApiValidationIssue;
  const message =
    typeof value.msg === "string"
      ? value.msg
      : typeof value.message === "string"
        ? value.message
        : "";
  if (!message) return "";

  const field = Array.isArray(value.loc)
    ? value.loc
        .filter((part) => part !== "body")
        .map(String)
        .join(".")
    : "";
  return field ? `${field}: ${message}` : message;
}

export function formatApiError(
  payload: unknown,
  status: number,
  fallback = "Request failed",
): string {
  if (payload && typeof payload === "object") {
    const result = payload as {
      detail?: unknown;
      message?: unknown;
      error?: unknown;
    };
    if (typeof result.detail === "string" && result.detail.trim()) {
      return result.detail;
    }
    if (Array.isArray(result.detail)) {
      const issues = result.detail
        .map(formatValidationIssue)
        .filter(Boolean);
      if (issues.length) return issues.join(" ");
    }
    if (typeof result.message === "string" && result.message.trim()) {
      return result.message;
    }
    if (typeof result.error === "string" && result.error.trim()) {
      return result.error;
    }
  }

  return `${fallback} (${status})`;
}
