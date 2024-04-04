import { atom } from "jotai";
import type { StateData } from "app/counties/types";
export const statesAtom = atom<StateData[]>([]);
