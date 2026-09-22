import React from "react";
import { Users, Zap, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignCardProps {
  title: string;
  description: string;
  requirement: string;
  requirementValue: string;
  duration: string;
  durationValue: string;
  boostType: "visibility" | "acquisition" | "premium";
  boostText: string;
  boostSubtext: string;
  commission: string;
  isActive: boolean;
  onToggle: () => void;
}

export function CampaignCard({
  title,
  description,
  requirement,
  requirementValue,
  duration,
  durationValue,
  boostType,
  boostText,
  boostSubtext,
  commission,
  isActive,
  onToggle,
}: CampaignCardProps) {
  const boostStyles = {
    visibility: {
      bg: "bg-[#f0fdf4]",
      icon: Zap,
      iconColor: "text-emerald-500",
      accent: "text-emerald-600",
    },
    acquisition: {
      bg: "bg-[#eff6ff]",
      icon: Users,
      iconColor: "text-blue-500",
      accent: "text-blue-600",
    },
    premium: {
      bg: "bg-[#fffbeb]",
      icon: Award,
      iconColor: "text-amber-500",
      accent: "text-amber-600",
    },
  }[boostType];

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            Requirement
          </span>
          <span className="text-xs font-bold text-sky-600">
            {requirementValue}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Duration</span>
          <span className="text-xs font-bold text-slate-700">
            {durationValue}
          </span>
        </div>
      </div>

      {/* Boost Badge */}
      <div
        className={cn(
          "rounded-2xl p-4 flex items-center gap-4 mb-6",
          boostStyles.bg,
        )}
      >
        <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
          <boostStyles.icon className={cn("h-5 w-5", boostStyles.iconColor)} />
        </div>
        <div>
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-wider",
              boostStyles.accent,
            )}
          >
            {boostText}
          </p>
          <p className="text-[10px] font-medium text-slate-400">
            {boostSubtext}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="text-[10px] font-medium text-slate-400">
          Platform Commission:{" "}
          <span className="text-slate-700">{commission}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-800">
            Join Campaign
          </span>
          <button
            onClick={onToggle}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
              isActive ? "bg-sky-500" : "bg-slate-200",
            )}
          >
            <div
              className={cn(
                "absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform",
                isActive ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
