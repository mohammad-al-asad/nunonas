import { LegalContentEditorServer } from "@/components/legal-content/server";

type SearchParams = Promise<{
  tab?: string;
}>;

export default async function SettingsLegalContentPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialDocument = params.tab === "privacy" ? "privacy" : "terms";

  return <LegalContentEditorServer initialDocument={initialDocument} />;
}
