import { OffersManagementView } from "@/components/offers/client";
import { fetchApiData } from "@/lib/server-api";

type DataPayload = {
  summaryCards: Array<{ label: string; value: string; note: string; tone: string }>;
  vendors: Array<{
    id: string;
    businessName: string;
    category: "HOSPITALITY" | "DINING" | "RENTALS";
    status: "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED";
  }>;
  offers: Array<{
    id: string;
    name: string;
    discount: string;
    validity: string;
    appliedTo: string;
    status: "Active" | "Inactive";
    redemptions: number;
    kind: "PERCENT" | "FLAT" | "BOGO";
    startDate: string;
    endDate: string;
    discountValue: number;
    selectedVendorIds: string[];
    providerCount: number;
    engagedUsers: number;
    providerBreakdown: Array<{
      providerId: string;
      providerName: string;
      vendorCategory: string;
      status: string;
      redemptions: number;
      engagedUsers: number;
      active: boolean;
    }>;
  }>;
};

const fallbackData: DataPayload = {
  summaryCards: [],
  vendors: [],
  offers: []
};

export async function OffersManagementViewServer() {
  const [offersData, vendorsData] = await Promise.all([
    fetchApiData<Omit<DataPayload, "vendors">>("/api/offers", { summaryCards: [], offers: [] }),
    fetchApiData<{
      vendors: Array<{
        id: string;
        businessName: string;
        category: "HOSPITALITY" | "DINING" | "RENTALS";
        status: "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED";
      }>;
    }>("/api/vendors", { vendors: [] }),
  ]);

  return (
    <OffersManagementView
      data={{
        summaryCards: offersData.summaryCards,
        offers: offersData.offers,
        vendors: vendorsData.vendors,
      }}
    />
  );
}
