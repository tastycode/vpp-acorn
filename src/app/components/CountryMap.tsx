"use client";
import { Color } from "@fly-lab/color-magic";
import { useEffect, useState } from "react";
import CountiesSVG from "../counties/index.svg";
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

    const paths = [...document.querySelectorAll("svg g > g > path")];
    for (const currentPath of paths) {
      const path = currentPath as SVGPathElement
      const {state: matchState, county: matchCounty}= stateCountyFromPath(path);
  if (!matchState || !matchCounty || !matchCounty.purged_percentage || !country?.purged_percentage.mean) continue;

  /*
      const favorableColor = {fill: new Color('#66dd66'), stroke: new Color('#33aa33')};
      const meanColor = {fill: new Color('#dddd66'), stroke: new Color('#aaaa33')};
      const unfavorableColor = {fill: new Color('#dd6666'), stroke: new Color('#aa3333')};
      const mixStateColor = matchCounty.purged_percentage_state_z! > 0 ? unfavorableColor : favorableColor;
      const mixStateFactor = Math.abs(matchCounty.purged_percentage_state_z!) / 2;//
      const fillColor = meanColor.fill.mix(mixStateColor.fill, mixStateFactor);
      const mixCountryColor = matchCounty.purged_percentage_country_z! > 0 ? unfavorableColor : favorableColor;
      const mixCountryFactor = Math.abs(matchCounty.purged_percentage_country_z!) / 2;
      const strokeColor = meanColor.stroke.mix(mixCountryColor.stroke, mixCountryFactor);
      */

      // meanColor is hue 105. at 2 standard deviations higher purge, we want it to be
      // hue 0 (#dd6666) and 2 standard deviations under the mean purge we want it at
      // hue 205 (#66dd66) .  if z is -2, then -1 * -2 * 50  = 100. if z is 2 then -1 * 2 * 50 = -100
      // FYI. Calling rotate on meanColor mutates meanColor 😱
     const meanHex = '#dddd66'
      const freshMeanColor = () => new Color(meanHex)
      const fillColor = freshMeanColor().rotate(-1 * matchCounty.purged_percentage_state_z! * 50)
      const strokeColor = freshMeanColor().rotate(-1 * matchCounty.purged_percentage_country_z! * 50).darken(20);

      // zoom into state
      path.addEventListener('mouseover', mouseOverHandlerFn(matchCounty, matchState));
      path.style.fill = fillColor.toRgb();
      path.style.stroke = strokeColor.toRgb();
      path.addEventListener('mouseover', mouseOverHandlerFn(matchCounty, matchState))
      path.addEventListener('click', countyClickHandlerFn(matchCounty, matchState))

    }
    applyFocusAttributes();
  }, [states, counties]);
  return (
    <div>
      <CountiesSVG />
      <pre style={{ display: "block", height: "1.5rem" }}>
        {JSON.stringify(county, null, 4)}
      </pre>
    </div>
  );
};

export default CountryMap;
