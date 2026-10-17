import { API_BASE_URL } from "@/lib/site";

export type LegalDocument = {
  document: string;
  title: string;
  content: string;
  lastUpdated: string;
};

// Edited in the admin dashboard under Settings > Legal content.
// Cached for 5 minutes so edits show up without a redeploy.
export async function getLegalDocument(docType: "terms" | "privacy"): Promise<LegalDocument | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/legal/${docType}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()) as LegalDocument;
  } catch {
    return null;
  }
}
