import { IndexedArray, createIndexedArray } from "../utils/indexedArray";
import { atom } from "jotai";
import type { StateData, CountyData } from "@/app/counties/types";
export const statesAtom = atom<IndexedArray<StateData>>(
  createIndexedArray<StateData>([]),
);
export const countiesAtom = atom<IndexedArray<CountyData>>(
  createIndexedArray<CountyData>([]),
);
