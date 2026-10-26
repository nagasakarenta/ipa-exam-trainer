import { useEffect, useMemo, useReducer, type ReactNode } from "react";
import { loadProgress, saveProgress, type Progress } from "../lib/storage";
import { ProgressContext } from "./context";
import { reducer } from "./reducer";

export function ProgressProvider({ children, initial }: { children: ReactNode; initial?: Progress }) {
  const [progress, dispatch] = useReducer(reducer, undefined, () => initial ?? loadProgress());
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);
  const value = useMemo(() => ({ progress, dispatch }), [progress]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
