import { createIndexedArray } from "@/utils/indexedArray";
import { PrivateCounty, PrivateState } from "@/app/counties/types";

export function enhanceData(data: { states: PrivateState[], counties: PrivateCounty[] }) {
  const states = createIndexedArray<PrivateState>(data.states.map(state => {
    return {
      ...state,
      counties: createIndexedArray<PrivateCounty>(state.counties)
    }
  }))
  const counties = createIndexedArray<PrivateCounty>(data.counties)
  return {
    ...data,
    states,
    counties
  }
};
