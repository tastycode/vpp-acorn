import { useAtom } from "jotai";
import { useEffect } from "react";
import { statesAtom } from "../states/atoms";

function PurgeApp({ Component, pageProps }) {
  const [_, setStatesData] = useAtom(statesAtom);
  useEffect(() => {
    if (pageProps.initialStatesData) {
      setStatesData(pageProps.initialStatesData);
    }
  }, [pageProps.initialStatesData, setStatesData]);

  return <Component {...pageProps} />;
}

export default PurgeApp;
