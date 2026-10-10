/**
 * Save the receipt returned by POST /vendor/booking-management/bookings/{id}/receipt.
 * The API sends the PDF as base64; returns false when the response has no file.
 */
export function downloadReceipt(result: Record<string, unknown>, fallbackName: string): boolean {
  const url = String(result.download_url ?? result.receipt_url ?? "");
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }
  if (typeof result.content_base64 !== "string") return false;

  const binary = atob(result.content_base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: String(result.content_type ?? "application/pdf") });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = String(result.filename ?? fallbackName);
  anchor.click();
  // Revoke after the browser has started the download.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return true;
}
