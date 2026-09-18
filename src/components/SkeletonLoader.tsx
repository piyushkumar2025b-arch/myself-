import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 animate-pulse">
      {/* Top Navbar Skeleton */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#090a0f]/80 border-b border-white/5 flex items-center justify-between px-8 z-50">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="hidden md:flex gap-4">
          <div className="w-16 h-4 rounded-full bg-white/10" />
          <div className="w-16 h-4 rounded-full bg-white/10" />
          <div className="w-16 h-4 rounded-full bg-white/10" />
        </div>
        <div className="w-24 h-8 rounded-full bg-white/10" />
      </div>

      {/* Hero Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="w-36 h-6 rounded-full bg-emerald-500/10" />
          <div className="w-3/4 h-14 rounded-2xl bg-white/10" />
          <div className="w-1/2 h-8 rounded-xl bg-white/10" />
          <div className="w-full max-w-lg h-20 rounded-xl bg-white/5" />
          <div className="flex gap-4">
            <div className="w-36 h-12 rounded-full bg-white/20" />
            <div className="w-36 h-12 rounded-full bg-white/10" />
          </div>
          <div className="flex gap-3 pt-4">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="w-10 h-10 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md aspect-square rounded-3xl bg-white/5 border border-white/10" />
        </div>
      </div>

      {/* Services Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-12">
        <div className="h-44 rounded-2xl bg-white/5" />
        <div className="h-44 rounded-2xl bg-white/5" />
        <div className="h-44 rounded-2xl bg-white/5" />
        <div className="h-44 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
};
