"use client";
import { Color } from "@fly-lab/color-magic";
import { useEffect, useState } from "react";
import CountiesSVG from "@/app/counties/index.svg";
import StatesSVG from "@/app/states/index.svg"
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { statesAtom, countiesAtom, countryAtom } from "../../states/atoms";
import { Maybe, CountyData, PrivateCounty, PrivateState, StateData, Nullable } from "../counties/types";

type CountryMapProps = {
  focusOn?: { countyName?: string; stateCode: string };
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
  const [country] = useAtom(countryAtom);
  const [state, setState] = useState<PrivateState | undefined>();
  const [county, setCounty] = useState<PrivateCounty | undefined>();

  const stateCountyFromPath = (path: SVGPathElement) : {
    state: Nullable<PrivateState>,
    county: Nullable<PrivateCounty>
  } => {
    const stateCode = path.getAttribute("data-state_code");
    if (!stateCode) return {state: null, county: null};
    const countyName = path.getAttribute("data-county_name");
    const matchState = states.$find("code", stateCode)!;
    if (!matchState) {
      return {state: null, county: null}
    }
    const matchCounty = matchState.counties.$find("name", countyName)!;
    return {state: matchState, county: matchCounty}
  };

  const stateFromPath = (path: SVGPathElement) : PrivateState => {
    const className = path.getAttribute('class')
    const stateCode = className!.match(/index_svg__(?<stateCode>[a-z]{2})/)!.groups!.stateCode.toUpperCase()
    return states.$find("code", stateCode)!
  }
  const applyFocusAttributes = () => {
    //debugger;
    let targetPath : Maybe<SVGPathElement | SVGGElement>;
    if (focusOn?.countyName) {
      const paths = [...document.querySelectorAll<SVGPathElement>("svg g > g > path")];
      const focusedPath = paths.find((path) => {
        const {state: matchState, county: matchCounty} = stateCountyFromPath(path);
        return (
          matchCounty &&
          matchCounty.name === focusOn.countyName &&
          matchState!.code === focusOn.stateCode
        );
      })
      targetPath = focusedPath;

    } else if (focusOn?.stateCode) {
      const paths = [...document.querySelectorAll<SVGPathElement>("svg g > g > path")];
      targetPath  = paths.find((path) => {
        const {state: matchState, county: matchCounty} = stateCountyFromPath(path);
        return matchState?.code === focusOn.stateCode;
      })?.closest('g')
    }
    let zoom = focusOn?.countyName ? 1.5 : 1;
    if (targetPath) {
      const pathBounds = targetPath?.getBBox();
      const svg = targetPath?.ownerSVGElement!;
      const {x,y,width,height} = resizeBoundsCentered(zoom, pathBounds);
      Object.assign(svg.viewBox.baseVal, { x, y, width, height } as Bounds)
     svg?.setAttribute('viewbox', `${x} ${y} ${width} ${height}`)
    }
  }

  const mouseOverHandlerFn = (county: PrivateCounty, state: PrivateState) => {
    return (e: MouseEvent) => {
      console.log('countyStats', county)
      setState(state);
      setCounty(county);
    }
  }

  const countyClickHandlerFn = (matchCounty: PrivateCounty, matchState: PrivateState) => (e) => {
    if (!router.query.stateCode) { // if county is not set, then only go to state levelon click
      router.push(`/states/${matchState!.code}`);
    } else if (!router.query.countyName) {
      router.push(`/states/${matchState!.code}/county/${matchCounty.name}`);
    }
  };

  useEffect(() => {
    if (states.length < 50) {
      console.warn('State data not yet loaded before map')
      return
    };

     const meanHex = '#dddd66'
      const freshMeanColor = () => new Color(meanHex)
    const countyPaths = [...document.querySelectorAll(".country-county svg g > g > path")];
    for (const currentPath of countyPaths) {
      const path = currentPath as SVGPathElement
      const {state: matchState, county: matchCounty}= stateCountyFromPath(path);
  if (!matchState || !matchCounty || !matchCounty.purged_percentage || !country?.purged_percentage.mean) continue;

      // meanColor is hue 105. at 2 standard deviations higher purge, we want it to be
      // hue 0 (#dd6666) and 2 standard deviations under the mean purge we want it at
      // hue 205 (#66dd66) .  if z is -2, then -1 * -2 * 50  = 100. if z is 2 then -1 * 2 * 50 = -100
      // FYI. Calling rotate on meanColor mutates meanColor 😱
      const fillColor = freshMeanColor().rotate(-1 * matchCounty.purged_percentage_state_z! * 50)
      const strokeColor = freshMeanColor().rotate(-1 * matchCounty.purged_percentage_country_z! * 50).darken(20);

      // zoom into state
      path.addEventListener('mouseover', mouseOverHandlerFn(matchCounty, matchState));
      path.style.fill = fillColor.toRgb();
      path.style.stroke = strokeColor.toRgb();
      path.addEventListener('mouseover', mouseOverHandlerFn(matchCounty, matchState))
      path.addEventListener('click', countyClickHandlerFn(matchCounty, matchState))

    }
    const statePaths = [...document.querySelectorAll<SVGPathElement>('.country-state svg > g  > path')]
    for (const statePath of statePaths) {
      const state = stateFromPath(statePath);
      if (!state?.stats) continue;
      const fillColor = freshMeanColor().rotate(-1 * state.stats.purged_percentage_country_z! * 50)
      statePath.style.fill = fillColor.toRgb();
      statePath.addEventListener('click' , () => {
        router.push(`/states/${state!.code}`);
      })
    }

    applyFocusAttributes();
  }, [states, counties]);
  if (focusOn?.stateCode) {
    return <div className="country-county w-full h-auto max-w-full overflow-hidden">
        <CountiesSVG />

    </div>
  } else {
    return (<>
        <div className="hidden lg:block w-full h-auto max-w-full overflow-hidden country-county">
          <CountiesSVG />
        </div>
        <div className="block lg:hidden w-full country-state">
          <StatesSVG/>
        </div>
      </>
    );

  }
};

export default CountryMap;
