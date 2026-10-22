"use client";

import { useState } from "react";
import { Compass } from "lucide-react";
import { VisiteGuideeModal } from "@/components/visite-guidee-modal";

export function RelancerVisiteGuidee() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <Compass className="h-3.5 w-3.5" />
        Relancer la visite guidée
      </button>
      <VisiteGuideeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
