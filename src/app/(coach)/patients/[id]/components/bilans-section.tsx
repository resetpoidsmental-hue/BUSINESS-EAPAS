"use client";

import { useRef, useState } from "react";
import { BilansComparison } from "./bilans-comparison";
import { BilansCharts } from "./bilans-charts";
import { BilanForm } from "./bilan-form";

interface BilanRow {
  id: string;
  phase: string;
  date: Date;
  observations: string | null;
  [key: string]: unknown;
}

interface ObjectifItem {
  id: string;
  texteSMART: string;
  dateCible: Date | null;
  atteint: boolean;
  createdAt: Date;
}

export function BilansSection({
  patientId,
  iaDisponible,
  bilans,
  objectifs,
}: {
  patientId: string;
  iaDisponible: boolean;
  bilans: BilanRow[];
  objectifs: ObjectifItem[];
}) {
  const [phase, setPhase] = useState("T0");
  const formRef = useRef<HTMLDivElement>(null);

  function selectPhase(p: string) {
    setPhase(p);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-8">
      <BilansComparison bilans={bilans} onSelectPhase={selectPhase} />
      <BilansCharts bilans={bilans} objectifs={objectifs} />
      <div ref={formRef} className="scroll-mt-4">
        <BilanForm patientId={patientId} iaDisponible={iaDisponible} bilans={bilans} phase={phase} onPhaseChange={setPhase} />
      </div>
    </div>
  );
}
