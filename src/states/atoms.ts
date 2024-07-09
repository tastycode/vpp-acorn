import { IndexedArray, createIndexedArray } from "../utils/indexedArray";
import { atom } from "jotai";
import type { PrivateState, PrivateCounty, SummaryStats, Nullable, RegionalStats} from "@/app/counties/types";
export const statesAtom = atom<IndexedArray<PrivateState>>(
  createIndexedArray<PrivateState>([]),
);
export const countiesAtom = atom<IndexedArray<PrivateCounty>>(
  createIndexedArray<PrivateCounty>([]),
);

export type CountryMetadata = Nullable<RegionalStats>
export const countryAtom = atom<CountryMetadata>(null);
