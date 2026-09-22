"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import {
  Info,
  Percent,
  Wallet,
  GlassWater,
  Sparkles,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorCreatePromotion } from "@/lib/vendor-api";

type OfferType = "percentage" | "fixed" | "happy_hour" | "custom";

export default function AddPromotionPage() {
  const router = useRouter();
  const [selectedOffer, setSelectedOffer] = useState<OfferType>("percentage");
  const [recurringDays, setRecurringDays] = useState<string[]>([
    "0",
    "1",
    "2",
    "3",
    "4",
  ]);
  const [requirePromoCode, setRequirePromoCode] = useState(true);
  const [firstTimeOnly, setFirstTimeOnly] = useState(false);
  const [formData, setFormData] = useState({
    promotionName: "",
    internalDescription: "",
    discountValue: "",
    applicableTo: "All Services",
    startDate: "",
    endDate: "",
    promoCode: "SUMMER20",
    minimumSpend: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: keyof typeof formData, value: string) => {
    setError("");
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleCreate = async () => {
    if (!formData.promotionName.trim() || !formData.startDate || !formData.endDate) {
      setError("Promotion name, start date, and end date are required.");
      return;
    }
    if (formData.endDate < formData.startDate) {
      setError("End date must be on or after the start date.");
      return;
    }
    if (requirePromoCode && !formData.promoCode.trim()) {
      setError("Enter the promo code customers must use.");
      return;
    }
    const discountValue = Number(formData.discountValue);
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      setError("Enter a valid discount value.");
      return;
    }
    if (selectedOffer === "percentage" && discountValue > 100) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }
    if (formData.minimumSpend.trim() && (!Number.isFinite(Number(formData.minimumSpend)) || Number(formData.minimumSpend) < 0)) {
      setError("Enter a valid minimum spend.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await vendorCreatePromotion({
        promotion_name: formData.promotionName.trim(),
        internal_description: formData.internalDescription.trim(),
        offer_type: {
          percentage: "percentage",
          fixed: "fixed_amount",
          happy_hour: "happy_hour",
          custom: "custom_deal",
        }[selectedOffer],
        discount_value: discountValue,
        applicable_to: formData.applicableTo,
        start_date: formData.startDate,
        end_date: formData.endDate,
        recurring_days: recurringDays,
        require_promo_code: requirePromoCode,
        promo_code: requirePromoCode ? formData.promoCode.trim() || null : null,
        first_time_customers_only: firstTimeOnly,
        minimum_spend: formData.minimumSpend.trim() ? Number(formData.minimumSpend) : null,
        active: true,
      });
      router.push("/promotions");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to create promotion.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: string, idx: number) => {
    const key = String(idx);
    setRecurringDays((prev) =>
      prev.includes(key)
        ? prev.filter((d) => d !== key)
        : [...prev, key],
    );
  };

  const days = ["M", "T", "W", "T", "F", "S", "S"];

  const renderOfferCard = (
    id: OfferType,
    icon: React.ElementType,
    label: string,
  ) => (
    <div
      onClick={() => setSelectedOffer(id)}
      className={cn(
        "relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all cursor-pointer group",
        selectedOffer === id
          ? "border-sky-500 bg-sky-50/30"
          : "border-slate-100 bg-white hover:border-slate-200",
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
          selectedOffer === id
            ? "text-sky-500"
            : "text-slate-400 group-hover:text-slate-600",
        )}
      >
        {React.createElement(icon, { className: "h-5 w-5" })}
      </div>
      <span
        className={cn(
          "text-xs font-bold",
          selectedOffer === id ? "text-sky-600" : "text-slate-500",
        )}
      >
        {label}
      </span>
      {selectedOffer === id && (
        <div className="absolute top-2 right-2 h-4 w-4 bg-sky-500 rounded-full flex items-center justify-center">
          <div className="h-1.5 w-1.5 bg-white rounded-full" />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-32">
      <Header title="Promotions" />

      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-[800px] mx-auto space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-6 w-6 bg-sky-500 rounded-lg flex items-center justify-center text-white">
                <Info className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Basic Information
              </h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Promotion Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer Wellness 2026"
                  value={formData.promotionName}
                  onChange={(event) => updateField("promotionName", event.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Internal Description
                </label>
                <textarea
                  placeholder="Brief explanation of this promotion for staff..."
                  rows={4}
                  value={formData.internalDescription}
                  onChange={(event) => updateField("internalDescription", event.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium resize-none"
                />
              </div>
            </div>
          </div>

          {/* Discount Details */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-8">
              Discount Details
            </h2>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Offer Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {renderOfferCard("percentage", Percent, "Percentage")}
                  {renderOfferCard("fixed", Wallet, "Fixed Amount")}
                  {renderOfferCard("happy_hour", GlassWater, "Happy Hour")}
                  {renderOfferCard("custom", Sparkles, "Custom Deal")}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Discount Value (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.discountValue}
                      onChange={(event) => updateField("discountValue", event.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Applicable To
                  </label>
                  <div className="relative">
                    <select value={formData.applicableTo} onChange={(event) => updateField("applicableTo", event.target.value)} className="appearance-none w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer font-medium text-slate-600">
                      <option>All Services</option>
                      <option>Spa Only</option>
                      <option>Dining Only</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validity & Schedule */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-6 w-6 bg-sky-500 rounded-lg flex items-center justify-center text-white">
                <Calendar className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Validity & Schedule
              </h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(event) => updateField("startDate", event.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(event) => updateField("endDate", event.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Recurring Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {days.map((day, idx) => {
                    const isSelected = recurringDays.includes(String(idx));
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleDay(day, idx)}
                        className={cn(
                          "flex-1 min-w-[48px] py-3 rounded-xl text-xs font-bold border-2 transition-all",
                          isSelected
                            ? "bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200",
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Usage & Conditions */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-8">
              Usage & Conditions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Require Promo Code
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Customer must enter a code to redeem
                    </p>
                  </div>
                  <button
                    onClick={() => setRequirePromoCode(!requirePromoCode)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                      requirePromoCode ? "bg-sky-500" : "bg-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        requirePromoCode ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                </div>
                {requirePromoCode && (
                  <input
                    type="text"
                    value={formData.promoCode}
                    onChange={(event) => updateField("promoCode", event.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      First-time customers only
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Limit to new guest registrations
                    </p>
                  </div>
                  <button
                    onClick={() => setFirstTimeOnly(!firstTimeOnly)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                      firstTimeOnly ? "bg-sky-500" : "bg-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        firstTimeOnly ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Minimum Spend ($)
                  </label>
                  <input
                    type="number"
                    placeholder="50.00"
                    value={formData.minimumSpend}
                    onChange={(event) => updateField("minimumSpend", event.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {error ? <p className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-lg">{error}</p> : null}

      {/* Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 md:left-20 lg:left-64 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-6 z-50 transition-all">
        <div className="max-w-[800px] mx-auto flex items-center justify-end gap-4 px-4 sm:px-0">
          <Link
            href="/promotions"
            className="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all border border-slate-100"
          >
            Cancel
          </Link>
          <button onClick={handleCreate} disabled={isSaving} className="px-8 py-3.5 bg-[#1e2a5e] hover:bg-[#1a2552] disabled:opacity-60 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl shadow-slate-900/10 transition-all">
            {isSaving ? "Creating..." : "Create Promotion"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
