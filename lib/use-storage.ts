"use client";
import { useSyncExternalStore } from "react";
import { getVersion, subscribe } from "./storage";

/** Returns a version number that changes whenever PrepRadar storage changes; -1 during SSR. */
export function useStorageVersion(): number {
  return useSyncExternalStore(subscribe, getVersion, () => -1);
}
