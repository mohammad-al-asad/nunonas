import { ContentManagementView } from "@/components/content-moderation/client";
import { fetchApiData } from "@/lib/server-api";

type DataPayload = {
  totalSubmissions: number;
  items: Array<{
    id: string;
    title: string;
    age: string;
    subtitle: string;
    venue: string;
    location: string;
    vendorId: string;
    queueType: "PHOTO" | "MENU" | "INFO";
    previewImage: string;
    state: "pending" | "approved" | "rejected";
  }>;
};

const fallbackData: DataPayload = {
  totalSubmissions: 0,
  items: []
};

export async function ContentManagementViewServer() {
  const data = await fetchApiData<DataPayload>("/api/content-moderation", fallbackData);
  return <ContentManagementView data={data} />;
}
