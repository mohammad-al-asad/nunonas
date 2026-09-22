import {
  ProfilePageClient,
  type ProfileSettingsData,
} from "@/components/profile/page-client";
import { fetchApiData } from "@/lib/server-api";

export default async function ProfilePage() {
  const profile = await fetchApiData<ProfileSettingsData>("/api/settings/profile");
  return <ProfilePageClient initialData={profile} />;
}
