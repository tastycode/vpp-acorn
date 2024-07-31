import { IndexedArray, createIndexedArray } from "../utils/indexedArray";
import { atom } from "jotai";
import type { PrivateState, PrivateCounty, SummaryStats, Nullable, RegionalStats, CountryMetadata} from "@/app/counties/types";
export const statesAtom = atom<IndexedArray<PrivateState>>(
  createIndexedArray<PrivateState>([]),
);
export const countiesAtom = atom<IndexedArray<PrivateCounty>>(
  createIndexedArray<PrivateCounty>([]),
);

export const countryAtom = atom<CountryMetadata>(null);

export const loadingAtom = atom<boolean>(false);
