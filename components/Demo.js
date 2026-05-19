"use client";

import { HomeIcon, FireIcon, PlayIcon, FolderIcon, TvIcon } from "@heroicons/react/24/solid";

export default function BottomNav() {
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2  w-[280px] mx-auto bg-black/10 border border-white/10 shadow-xl items-center backdrop-blur-sm   border-t rounded-2xl ">
      {/* Floating Action Button (center gap) */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
        <button className="bg-cyan-400 hover:bg-cyan-600 text-white rounded-full p-4 shadow-lg">
          <PlayIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-around items-center py-3">
        {/* Home */}
        <button className="flex flex-col items-center text-cyan-400 hover:text-cyan-500">
          <HomeIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Home</span>
        </button>

        {/* Shorts */}
        <button className="flex flex-col items-center text-cyan-400 hover:text-cyan-500">
          <FireIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Shorts</span>
        </button>

        {/* Center Gap (for FAB) */}
        <div className="w-12" />

        {/* Subscriptions */}
        <button className="flex flex-col items-center text-cyan-400 hover:text-cyan-500">
          <TvIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Subscriptions</span>
        </button>

        {/* Library */}
        <button className="flex flex-col items-center text-cyan-400 hover:text-cyan-500">
          <FolderIcon className="w-6 h-6" />
          <span className="text-xs mt-1">Library</span>
        </button>
      </div>
    </div>
  );
}
