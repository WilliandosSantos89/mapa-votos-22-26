import { useState, type ReactNode } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComparisonFilters({ primary, children, activeCount = 0 }: { primary: ReactNode; children: ReactNode; activeCount?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <section aria-label="Filtros da comparação" className="border-y border-border py-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 md:grid-cols-5">
        {primary}
        <Button variant="outline" className="h-11 gap-2 md:hidden" aria-expanded={open} aria-controls="comparison-extra-filters" onClick={() => setOpen(!open)}>
          <SlidersHorizontal className="h-4 w-4" /> Filtros{activeCount > 0 && ` (${activeCount})`}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
        <div id="comparison-extra-filters" className={`${open ? "grid" : "hidden"} col-span-2 grid-cols-1 gap-3 sm:grid-cols-2 md:contents`}>
          {children}
        </div>
      </div>
    </section>
  );
}