import {
  SettingsPageClient,
  type SettingsProfileData,
} from "@/components/settings/page-client";
import { fetchApiData } from "@/lib/server-api";

type SettingsNotificationData = {
  new_booking?: boolean;
  booking_cancellation?: boolean;
  new_review?: boolean;
  platform_updates?: boolean;
};

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

async function fetchOrDefault<T extends object>(path: string, fallback: T): Promise<T> {
  try {
    return await fetchApiData<T>(path);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    return fallback;
  }
}

export default async function SettingsPage() {
  const [profile, notifications] = await Promise.all([
    fetchOrDefault<SettingsProfileData>("/api/settings/profile", {}),
    fetchOrDefault<SettingsNotificationData>("/api/settings/notifications", {}),
  ]);

  return (
    <SettingsPageClient
      initialProfile={profile}
      initialNotifications={notifications}
    />
  );
}
