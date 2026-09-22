"use client";

import React from "react";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Star,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    type: "up" | "down" | "neutral" | "alert" | "success" | "rating";
  };
}

export function StatsCard({ title, value, trend }: StatsCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          {title}
        </h3>
        <p className="text-4xl font-bold text-slate-800">{value}</p>
      </div>

      {trend && (
        <div className="mt-4 flex items-center">
          {trend.type === "up" && (
            <div className="flex items-center text-emerald-500 text-sm font-medium">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span>{trend.value}</span>
            </div>
          )}
          {trend.type === "down" && (
            <div className="flex items-center text-red-500 text-sm font-medium">
              <TrendingDown className="mr-1 h-4 w-4" />
              <span>{trend.value}</span>
            </div>
          )}
          {trend.type === "alert" && (
            <div className="flex items-center text-amber-500 text-sm font-medium">
              <AlertCircle className="mr-1 h-4 w-4" />
              <span>{trend.value}</span>
            </div>
          )}
          {trend.type === "success" && (
            <div className="flex items-center text-emerald-500 text-sm font-medium">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              <span>{trend.value}</span>
            </div>
          )}
          {trend.type === "rating" && (
            <div className="flex items-center text-sky-500 text-sm font-medium">
              <Star className="mr-1 h-4 w-4 fill-sky-500" />
              <span className="ml-1 text-slate-400 font-normal">
                {trend.value}
              </span>
            </div>
          )}
          {trend.type === "neutral" && (
            <div className="flex items-center text-emerald-500 text-sm font-medium">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
