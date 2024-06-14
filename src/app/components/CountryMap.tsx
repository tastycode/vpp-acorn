"use client";
import { Color } from "@fly-lab/color-magic";
import { useEffect, useState } from "react";
import CountiesSVG from "../counties/index.svg";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { statesAtom, countiesAtom } from "../../states/atoms";
import { CountyData, StateData } from "../counties/types";
import nj from "numjs";
import * as R from "ramda";

const featureStats = (dataset: Record<string, any>, column: string) => {
  const values = dataset.map(R.prop(column));
  const arr = nj.array(values);
  console.log("featureStats", values, arr);
  return {
    total: arr.sum(),
    mean: arr.mean(),
    std: arr.std(),
  };
};

type CountryMapProps = {
  focusOn?: { county?: string; state: string };
};
type Bounds = { x: number; y: number; width: number; height: number };

function resizeBoundsCentered<K extends Bounds>(factor: number, bounds: K) : K  {
  const { x, y, width, height } = bounds;
  const newWidth = width * factor;
  const newHeight = height * factor;
  const newX = x + (width - newWidth) / 2;
  const newY = y + (height - newHeight) / 2;
  return { x: newX, y: newY, width: newWidth, height: newHeight } as K;
}
export const CountryMap = ({ focusOn }: CountryMapProps) => {
  const router = useRouter();
  const [states] = useAtom(statesAtom);
  const [counties] = useAtom(countiesAtom);
  const [state, setState] = useState<StateData>();
  const [county, setCounty] = useState<CountyData>();

  const stateCountyFromPath = (path: SVGPathElement) => {
    const stateFips = path.getAttribute("data-state_fips");
    if (!stateFips) return [];
    const countyFips = path.getAttribute("data-county_fips");
    const fips = stateFips.padStart(2, "0") + countyFips.padStart(3, "");
    const matchState = states.$find("fips", stateFips);
    const matchCounty = counties.$find("fips", fips);
    return [matchState, matchCounty];
  };
  const applyFocusAttributes = () => {
    //debugger;
    let targetPath : SVGPathElement | SVGGElement | undefined;
    if (focusOn?.county) {
      const paths = [...document.querySelectorAll<SVGPathElement>("svg g > g > path")];
      const focusedPath = paths.find((path) => {
        const [matchState, matchCounty] = stateCountyFromPath(path);
        return (
          matchCounty &&
          matchCounty.county === focusOn.county &&
          matchState?.code === focusOn.state
        );
      })
      targetPath = focusedPath;

    } else if (focusOn?.state) {
      const paths = [...document.querySelectorAll<SVGPathElement>("svg g > g > path")];
      targetPath  = paths.find((path) => {
        const [matchState, matchCounty] = stateCountyFromPath(path);
        return matchState?.code === focusOn.state;
      })?.closest('g')
    }
    let zoom = focusOn?.county ? 1.5 : 1;
    if (targetPath) {
      const pathBounds = targetPath?.getBBox();
      const svg = targetPath?.ownerSVGElement!;
      const {x,y,width,height} = resizeBoundsCentered(zoom, pathBounds);
      Object.assign(svg.viewBox.baseVal, { x, y, width, height } as Bounds)
     svg?.setAttribute('viewbox', `${x} ${y} ${width} ${height}`)
    }
  }
  const handleMouseOver = (e: any) => {
    if (e.target.matches("path")) {
      const [matchState, matchCounty] = stateCountyFromPath(e.target);
      setState(matchState as StateData);
      setCounty(matchCounty as CountyData);
    }
  };
  const handleCountyClick = (e) => {
    const [matchState, matchCounty] = stateCountyFromPath(e.target);
    if (!router.query.state) { // if county is not set, then only go to state levelon click
      router.push(`/states/${matchState!.code}`);
    } else if (!router.query.county) {
      router.push(`/states/${matchState!.code}/county/${matchCounty.county}`);
    }
  };

  useEffect(() => {
    const metadata = states.reduce(
      (o, state) => {
        o[state["code"]] = {
          total: featureStats(state.counties, "total_voters"),
          purged: featureStats(state.counties, "purged_voters"),
          pcnt: featureStats(state.counties, "purged_pcnt"),
        };
        return o;
      },
      {
        "*": {
          total: featureStats(counties, "total_voters"),
          purged: featureStats(counties, "purged_voters"),
          pcnt: featureStats(counties, "purged_pcnt"),
        },
      },//The meeting code is 824 190 6161
    );

    const paths = [...document.querySelectorAll("svg g > g > path")];
    for (const path of paths) {
      const [matchState, matchCounty] = stateCountyFromPath(path);
      if (!matchCounty) continue;
      const purgeZCountry =
        (matchCounty.purged_pcnt - metadata["*"]["pcnt"]["mean"]) /
        metadata["*"]["pcnt"]["std"];
      const purgeZState =
        (matchCounty.purged_pcnt - metadata[matchState.code]["pcnt"]["mean"]) /
        metadata[matchState.code]["pcnt"]["std"];
      const fillColor = new Color(purgeZState > 0 ? "red" : "blue");
      const strokeColor = new Color(purgeZCountry > 0 ? "red" : "blue");
      if (purgeZState > 1) {
        console.log(matchCounty, purgeZCountry, purgeZState);
      } else if (purgeZState < -1) {
      }

      // zoom into state

      path.setAttribute("data-z_state", purgeZState);
      path.setAttribute("data-purged_pcnt", matchCounty.purged_pcnt);
      path.setAttribute("data-z_country", purgeZCountry);
      path.setAttribute(
        "data-m_state",
        metadata[matchState.code]["pcnt"]["mean"],
      );
      path.setAttribute("data-m_country", metadata["*"]["pcnt"]["mean"]);

      path.style.fill = fillColor
        .saturation((Math.abs(purgeZCountry) / 3.0) * 100.0)
        .to();
      path.style.stroke = strokeColor
        .saturation((Math.abs(purgeZState) / 3.0) * 100.0)
        .to();

    }
    applyFocusAttributes();
  }, [counties]);
  return (
    <div onMouseOver={handleMouseOver} onClick={handleCountyClick}>
      <pre style={{ display: "block", height: "1.5rem" }}>
        {JSON.stringify(county)}
      </pre>
      <CountiesSVG />
    </div>
  );
};

export default CountryMap;
