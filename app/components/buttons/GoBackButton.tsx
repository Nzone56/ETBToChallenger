"use client";

import { ArrowLeft } from "lucide-react";

export const GoBackButton = () => {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      Back
    </button>
  );
};
