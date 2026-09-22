"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { vendorProfileQuery, vendorQueryKeys } from "@/lib/vendor-queries";
import {
  extractVendorCategories,
  getFallbackRouteForCategories,
  isRouteAllowedForCategories,
  VENDOR_CATEGORIES_UPDATED_EVENT,
} from "@/lib/vendor-access";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  closeMobileNavigation,
  closePortalOverlays,
} from "@/store/slices/portal-ui-slice";
import { setProviderCategories } from "@/store/slices/provider-slice";

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const mobileNavigationOpen = useAppSelector(
    (state) => state.portalUi.mobileNavigationOpen,
  );
  const categories = useAppSelector((state) => state.provider.categories);
  const profileQuery = useQuery(vendorProfileQuery());

  useEffect(() => {
    if (!profileQuery.data) return;
    const nextCategories = extractVendorCategories(
      profileQuery.data.categories ?? profileQuery.data.category,
    );
    dispatch(setProviderCategories(nextCategories));
    if (!isRouteAllowedForCategories(pathname, nextCategories)) {
      router.replace(getFallbackRouteForCategories(nextCategories));
    }
  }, [dispatch, pathname, profileQuery.data, router]);

  useEffect(() => {
    const handleCategoriesUpdated = (event: Event) => {
      const nextCategories = extractVendorCategories(
        (event as CustomEvent<unknown>).detail,
      );
      dispatch(setProviderCategories(nextCategories));
      void queryClient.refetchQueries({ queryKey: vendorQueryKeys.profile });
      if (!isRouteAllowedForCategories(pathname, nextCategories)) {
        router.replace(getFallbackRouteForCategories(nextCategories));
      }
    };

    window.addEventListener(VENDOR_CATEGORIES_UPDATED_EVENT, handleCategoriesUpdated);
    return () => {
      window.removeEventListener(
        VENDOR_CATEGORIES_UPDATED_EVENT,
        handleCategoriesUpdated,
      );
    };
  }, [dispatch, pathname, queryClient, router]);

  useEffect(() => {
    dispatch(closePortalOverlays());
  }, [dispatch, pathname]);

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f8fafc]">
      <Sidebar
        categories={categories}
        mobileOpen={mobileNavigationOpen}
        onMobileClose={() => dispatch(closeMobileNavigation())}
      />
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <Header global />
        <div className="min-h-full w-full">{children}</div>
      </main>
    </div>
  );
}
