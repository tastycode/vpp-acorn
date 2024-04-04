"use client";
import { useEffect, useState } from "react";
import CountiesSVG from "../counties/index.svg";
import { useAtom } from "jotai";
import { statesAtom } from "../../states/atoms";

export default function CountryMap() {
  const handleMouseOver = (e) => {};
  const [states] = useAtom(statesAtom);

  return (
    <div onMouseOver={handleMouseOver}>
      <pre>{JSON.stringify(states, null, 4)}</pre>
      <CountiesSVG />
    </div>
  );
}
