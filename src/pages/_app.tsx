"use client";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { statesAtom, countiesAtom, countryAtom } from "../states/atoms";
import { enhanceData } from '@/utils/enhanceData'

function PurgeApp({ Component, pageProps }) {
  const enhancedData = enhanceData(pageProps)
  const [_, setStatesData] = useAtom(statesAtom);
  const [__, setCountiesData] = useAtom(countiesAtom);
  const [___, setCountryData] = useAtom(countryAtom);

  useEffect(() => {
    if (enhancedData.states && enhancedData.counties && enhancedData.country) {
      setStatesData(enhancedData.states);
      setCountiesData(enhancedData.counties);
      setCountryData(enhancedData.country);
    }
  }, [pageProps]);

  return <Component {...pageProps} />;
}

export default PurgeApp;