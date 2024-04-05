"use client";
import { useEffect, useState } from "react";
import CountiesSVG from "../counties/index.svg";
import { useAtom } from "jotai";
import { statesAtom, countiesAtom } from "../../states/atoms";
import { CountyData, StateData } from "../counties/types";

export default function CountryMap() {
  const [states] = useAtom(statesAtom);
  const [counties] = useAtom(countiesAtom);
  const [state, setState] = useState<StateData>();
  const [county, setCounty] = useState<CountyData>();

  const handleMouseOver = (e: any) => {
    if (e.target.matches("path")) {
      console.log("handleMouseOver", e.target);
      const stateFips = e.target.getAttribute("data-state_fips");
      if (!stateFips)
        return;
      const countyFips = e.target.getAttribute("data-county_fips");
      const fips = stateFips.padStart(2, "0") + countyFips.padStart(3, "");
      const matchState = states.$find("fips", stateFips);
      const matchCounty = counties.$find("fips", fips);
      setState(matchState);
      setCounty(matchCounty);
    }
  };
  return (
    <div onMouseOver={handleMouseOver}>
      <CountiesSVG />
      <pre>{JSON.stringify(county)}</pre>
    </div>
  );
}
