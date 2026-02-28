"use client";

import { ArrowLeft } from "lucide-react";

export const GoBackButton = () => {
  return (
    <button
      onClick={() => window.history.back()}
      className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Go Back
    </button>
  );
};
