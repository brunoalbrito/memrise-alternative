import { useCallback } from "react";
import { useSearchParams } from "react-router";
import type { FilterValue } from "../model/types";

function parseFilter(raw: string | null): FilterValue {
  if (raw === "goal" || raw === "teaching") return raw;
  if (raw !== null && raw.startsWith("cat:") && raw.length > 4) {
    return raw as FilterValue;
  }
  return "all";
}

export function useFilterParam(): [FilterValue, (filter: FilterValue) => void] {
  const [params, setParams] = useSearchParams();
  const filter = parseFilter(params.get("filter"));

  const setFilter = useCallback(
    (next: FilterValue) => {
      setParams(
        (prev) => {
          const copy = new URLSearchParams(prev);
          if (next === "all") copy.delete("filter");
          else copy.set("filter", next);
          return copy;
        },
        { replace: false },
      );
    },
    [setParams],
  );

  return [filter, setFilter];
}
