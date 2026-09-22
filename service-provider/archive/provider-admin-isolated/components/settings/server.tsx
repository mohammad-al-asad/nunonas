import { SettingsView } from "@/components/settings/client";
import { fetchApiData } from "@/lib/server-api";

type SettingsData = {
  title: string;
  description: string;
  general: {
    platformName: string;
    supportEmail: string;
    brandIdentity: {
      note: string;
      cta: string;
    };
  };
  commission: {
    globalRate: string;
    categoryRate: string;
    categoryLabel: string;
  };
  legal: {
    terms: string;
    privacy: string;
    gdpr: string;
    gdprStatus: string;
  };
  admin: {
    name: string;
    email: string;
    avatar?: string;
  };
};

export async function SettingsViewServer() {
  const data = await fetchApiData<SettingsData>("/api/settings");
  return <SettingsView data={data} />;
}
