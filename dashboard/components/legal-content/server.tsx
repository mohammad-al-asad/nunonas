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

const fallbackData: LegalContentData = {
  title: "Legal Content Editor",
  lastUpdated: "January 15, 2025 at 2:30 PM",
  documents: {
    terms: "Terms of Service",
    privacy: "Privacy Policy"
  },
  audiences: {
    apps: "Apps",
    business: "Business"
  },
  content: {
    terms: {
      apps:
        "# Terms of Service\n\n### 1. Acceptance of Terms\nBy accessing and using our platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.",
      business:
        "# Business Terms of Service\n\n### 1. Commercial Eligibility\nBusiness accounts must provide accurate company information and maintain an active point of contact for compliance updates."
    },
    privacy: {
      apps:
        "# Privacy Policy\n\n### 1. Information We Collect\nWe collect account details, device information, and usage activity needed to operate, secure, and improve the app experience.",
      business:
        "# Business Privacy Policy\n\n### 1. Business Contact Data\nWe collect administrator details, team member information, and account-level configuration data required to deliver business services."
    }
  }
};

export async function LegalContentEditorServer({
  initialDocument = "terms"
}: {
  initialDocument?: DocumentKey;
}) {
  const data = await fetchApiData<LegalContentData>("/api/legal-content", fallbackData);
  return <LegalContentEditor data={data} initialDocument={initialDocument} />;
}
