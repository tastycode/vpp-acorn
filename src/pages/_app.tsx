"use client";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { statesAtom } from "../states/atoms";
import { countiesAtom } from "../states/atoms";
import { createIndexedArray } from "@/utils/indexedArray";
import { CountyData, StateData } from "@/app/counties/types";

function PurgeApp({ Component, pageProps }) {
  const [_, setStatesData] = useAtom(statesAtom);
  const [__, setCountiesData] = useAtom(countiesAtom);
  useEffect(() => {
    if (pageProps.initialStatesData) {
      console.log("initialStatesData", pageProps.initialStatesData);
      setStatesData(createIndexedArray<StateData>(pageProps.initialStatesData));
      const counties: CountyData[] = [];
      for (const state of pageProps.initialStatesData) {
        counties.push(...state.counties);
      }
      setCountiesData(createIndexedArray<CountyData>(counties));
    }
  }, [pageProps.initialStatesData, setStatesData]);

  return <Component {...pageProps} />;
}

export default PurgeApp;
