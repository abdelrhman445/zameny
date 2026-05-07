'use client';

import React from 'react';

export default function OverviewLoading() {
  return (
    <div className="space-y-8 pb-10">
      
      {/* ── Header Skeleton ── */}
      <div className="flex flex-col gap-3">
        {/* Badge Skeleton */}
        <div className="w-24 h-7 rounded-full bg-slate-200/60 animate-pulse" />
        {/* Title Skeleton */}
        <div className="w-48 h-9 rounded-lg bg-slate-200/80 animate-pulse" />
        {/* Subtitle Skeleton */}
        <div className="w-72 h-4 rounded-md bg-slate-200/50 animate-pulse mt-1" />
      </div>

      {/* ── Primary KPI Cards Skeleton ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-6">
              {/* Card Title */}
              <div className="w-24 h-4 rounded-md bg-slate-200/60 animate-pulse" />
              {/* Card Icon */}
              <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
            </div>
            {/* Main Value */}
            <div className="w-32 h-8 rounded-lg bg-slate-200/80 animate-pulse mb-3" />
            {/* Subtext */}
            <div className="w-20 h-3 rounded-md bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>

      {/* ── Secondary Stats Skeleton ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-5 border border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-16 h-3 rounded-md bg-slate-200/60 animate-pulse" />
              <div className="w-12 h-6 rounded-md bg-slate-200/80 animate-pulse" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 animate-pulse" />
          </div>
        ))}
      </div>

      {/* ── Charts Skeleton ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large Chart Skeleton */}
        <div className="lg:col-span-2 bg-white border border-slate-200/50 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="w-48 h-5 rounded-md bg-slate-200/60 animate-pulse mb-8" />
          <div className="w-full h-[220px] rounded-xl bg-slate-50 animate-pulse flex items-end justify-between px-4 pb-2">
            {/* Fake Bars */}
            {[40, 70, 45, 90, 65, 30].map((height, idx) => (
              <div key={idx} className="w-12 bg-slate-200/50 rounded-t-md" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>

        {/* Small Chart Skeleton */}
        <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col items-center">
          <div className="w-full flex justify-start mb-8">
            <div className="w-32 h-5 rounded-md bg-slate-200/60 animate-pulse" />
          </div>
          {/* Fake Donut */}
          <div className="w-40 h-40 rounded-full border-[16px] border-slate-100 animate-pulse" />
          <div className="flex gap-4 mt-8 w-full justify-center">
            <div className="w-12 h-3 rounded-md bg-slate-200/60 animate-pulse" />
            <div className="w-12 h-3 rounded-md bg-slate-200/60 animate-pulse" />
            <div className="w-12 h-3 rounded-md bg-slate-200/60 animate-pulse" />
          </div>
        </div>

      </div>
    </div>
  );
}