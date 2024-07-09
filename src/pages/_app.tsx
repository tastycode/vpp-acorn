// @ts-nocheck 
// the errors that result when trying to pre-render 500 and 404 pages
// are endless and ridiculous. I can't created an indexedArray from never[] 
"use client";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { statesAtom, countiesAtom, countryAtom } from "../states/atoms";
import { enhanceData } from '@/utils/enhanceData'
import '@/app/globals.css'

function PurgeApp({ Component, pageProps }) {

  const enhancedData = enhanceData(pageProps)
  const [_, setStatesData] = useAtom(statesAtom);
  const [__, setCountiesData] = useAtom(countiesAtom);
  const [___, setCountryData] = useAtom(countryAtom);

  useEffect(() => {
    if (enhancedData.states.length > 0 && enhancedData.counties && enhancedData.country) {
      setStatesData(enhancedData.states);
      setCountiesData(enhancedData.counties);
      setCountryData(enhancedData.country);
    }
  }, [pageProps]);

  return <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Component {...pageProps} />;
    </main>
}

export default PurgeApp;