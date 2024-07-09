import { createIndexedArray } from "@/utils/indexedArray";
import { CountryMetadata, PrivateCounty, PrivateState } from "@/app/counties/types";

export function enhanceData(data: { states: PrivateState[], counties: PrivateCounty[], country: CountryMetadata}) {
  if (data.states) {
    const states = createIndexedArray<PrivateState>((data.states ?? []).map(state => {
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
  } else {
    return {
      states: [],
      counties: [],
      country: {

      }
    }
  }
};
