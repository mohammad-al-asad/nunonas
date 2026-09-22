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

const fallbackData: SettingsData = {
  title: "Admin Settings",
  description: "Manage your platform configuration, users, and global parameters.",
  general: {
    platformName: "SwiftBook Pro",
    supportEmail: "support@platform.com",
    brandIdentity: {
      note: "Upload a logo for the admin panel and emails. Suggested size: 512x512px (PNG, SVG).",
      cta: "Update Favicon"
    }
  },
  commission: {
    globalRate: "12.50",
    categoryRate: "18.00",
    categoryLabel: "Luxury"
  },
  legal: {
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    gdpr: "GDPR Compliance",
    gdprStatus: "Active"
  },
  admin: {
    name: "John Administrator",
    email: "admin@yardworkpro.com",
    avatar: "/images/avatars/admin.jpg"
  }
};

export async function SettingsViewServer() {
  const data = await fetchApiData<SettingsData>("/api/settings", fallbackData);
  return <SettingsView data={data} />;
}
