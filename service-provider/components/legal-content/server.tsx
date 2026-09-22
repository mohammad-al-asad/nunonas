import { LegalContentEditor } from "@/components/legal-content/client";
import { fetchApiData } from "@/lib/server-api";

type DocumentKey = "terms" | "privacy";
type AudienceKey = "apps" | "business";

type LegalContentData = {
  title: string;
  lastUpdated: string;
  documents: Record<DocumentKey, string>;
  audiences: Record<AudienceKey, string>;
  content: Record<DocumentKey, Record<AudienceKey, string>>;
};

export async function LegalContentEditorServer({
  initialDocument = "terms"
}: {
  initialDocument?: DocumentKey;
}) {
  const data = await fetchApiData<LegalContentData>("/api/legal-content");
  return <LegalContentEditor data={data} initialDocument={initialDocument} />;
}
