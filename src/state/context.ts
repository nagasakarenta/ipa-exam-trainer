import { createContext, useContext } from "react";
import type { Progress } from "../lib/storage";
import type { Action } from "./reducer";

export interface Store {
  progress: Progress;
  dispatch: (a: Action) => void;
}

export const ProgressContext = createContext<Store | null>(null);

export function useProgress() {
  const s = useContext(ProgressContext);
  if (!s) throw new Error("ProgressProvider の中で使ってください");
  return s;
}
