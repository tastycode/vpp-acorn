"use client";
import React, { useEffect, useState } from "react";
import CountiesSVG from "@/app/counties/index.svg";
import StatesSVG from "@/app/states/index.svg"
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { statesAtom, countiesAtom, countryAtom } from "../../states/atoms";
import { Maybe, CountyData, PrivateCounty, PrivateState, StateData, Nullable } from "../counties/types";
import { colorForZ } from "@/app/utils";
import { cn } from "@/lib/utils";

type CountryMapProps = {
  focusOn?: { countyName?: string; stateCode: string };
};
type Bounds = { x: number; y: number; width: number; height: number };

function resizeBoundsCentered<K extends Bounds>(factor: number, bounds: K): K {
  const { x, y, width, height } = bounds;
  const newWidth = width * factor;
  const newHeight = height * factor;
  const newX = x + (width - newWidth) / 2;
  const newY = y + (height - newHeight) / 2;
  return { x: newX, y: newY, width: newWidth, height: newHeight } as K;
}

// Add this type definition
type LegendItem = {
  dataKey: string;
  label: string;
  color: string;
};


export const CountryMap = ({ focusOn }: CountryMapProps) => {
  const router = useRouter();
  const [states] = useAtom(statesAtom);
  const [counties] = useAtom(countiesAtom);
  const [country] = useAtom(countryAtom);
  const [currentState, setCurrentState] = useState<PrivateState | undefined>();
  const [currentCounty, setCurrentCounty] = useState<PrivateCounty | undefined>();

  const stateCountyFromPath = (path: SVGPathElement): {
    state: Nullable<PrivateState>,
    county: Nullable<PrivateCounty>
  } => {
    const stateCode = path.getAttribute("data-state_code");
    if (!stateCode) return { state: null, county: null };
    const countyName = path.getAttribute("data-county_name");
    const matchState = states.$find("code", stateCode)!;
    if (!matchState) {
      return { state: null, county: null };
    }
    const matchCounty = matchState.counties.$find("name", countyName)!;
    return { state: matchState, county: matchCounty };
  };

  const stateFromPath = (path: SVGPathElement): PrivateState => {
    const className = path.getAttribute('class');
    const stateCode = className!.match(/index_svg__(?<stateCode>[a-z]{2})/)!.groups!.stateCode.toUpperCase();
    return states.$find("code", stateCode)!;
  };

  const applyFocusAttributes = () => {
    let targetPath: Maybe<SVGPathElement | SVGGElement>;
    if (focusOn?.countyName) {
      const paths = [...document.querySelectorAll<SVGPathElement>("svg g > g > path")];
      const focusedPath = paths.find((path) => {
        const { state: matchState, county: matchCounty } = stateCountyFromPath(path);
        return (
          matchCounty &&
          matchCounty.name === focusOn.countyName &&
          matchState!.code === focusOn.stateCode
        );
      });
      targetPath = focusedPath;
    } else if (focusOn?.stateCode) {
      const paths = [...document.querySelectorAll<SVGPathElement>("svg g > g > path")];
      targetPath = paths.find((path) => {
        const { state: matchState } = stateCountyFromPath(path);
        return matchState?.code === focusOn.stateCode;
      })?.closest('g');
    }
    let zoom = focusOn?.countyName ? 1.5 : 1;
    if (targetPath) {
      const pathBounds = targetPath?.getBBox();
      const svg = targetPath?.ownerSVGElement!;
      const { x, y, width, height } = resizeBoundsCentered(zoom, pathBounds);
      Object.assign(svg.viewBox.baseVal, { x, y, width, height } as Bounds);
      svg?.setAttribute('viewbox', `${x} ${y} ${width} ${height}`);
    }
  };

  const mouseOverHandlerFn = (county: PrivateCounty, state: PrivateState) => {
    return (e: MouseEvent) => {
      console.log('countyStats', county);
      setCurrentState(state);
      setCurrentCounty(county);
    };
  };

  const countyClickHandlerFn = (matchCounty: PrivateCounty, matchState: PrivateState) => (e) => {
    if (!router.query.stateCode) { // if county is not set, then only go to state level on click
      router.push(`/states/${matchState!.code}`);
    } else if (!router.query.countyName) {
      router.push(`/states/${matchState!.code}/county/${matchCounty.name}`);
    }
  };

  useEffect(() => {
    if (states.length < 50) {
      console.warn('State data not yet loaded before map');
      return;
    } else {
      console.log('State data loaded ', states);
    }

    const countyPaths = [...document.querySelectorAll(".country-county svg g > g > path")];
    for (const currentPath of countyPaths) {
      const path = currentPath as SVGPathElement;
      const { state: matchState, county: matchCounty } = stateCountyFromPath(path) as { state: PrivateState, county: PrivateCounty };
      if (!matchState || !matchCounty || !matchCounty.purged_percentage || !country?.purged_percentage.mean) continue;

      const fillColor = colorForZ(matchCounty.purged_percentage_state_z!);
      const strokeColor = colorForZ(matchCounty.purged_percentage_country_z!).darken(20);

      // zoom into state
      path.addEventListener('mouseover', mouseOverHandlerFn(matchCounty, matchState));
      path.style.fill = fillColor.toRgb();
      path.style.stroke = strokeColor.toRgb();
      path.addEventListener('mouseover', mouseOverHandlerFn(matchCounty, matchState));
      path.addEventListener('click', countyClickHandlerFn(matchCounty, matchState));
    }

    const statePaths = [...document.querySelectorAll<SVGPathElement>('.country-state svg > g  > path')];
    for (const statePath of statePaths) {
      const matchState = stateFromPath(statePath);
      if (!matchState?.stats) continue;
      const fillColor = colorForZ(matchState.stats.purged_percentage_country_z!);
      statePath.style.fill = fillColor.toRgb();
      statePath.addEventListener('click', () => {
        router.push(`/states/${matchState!.code}`);
      });
    }

    applyFocusAttributes();
  }, [states, counties]);

  const zLegend  = React.useMemo<LegendItem[] | null>(() => {
    const state = focusOn?.stateCode && states.$find('code', focusOn.stateCode);
  

    const zLegend = focusOn?.stateCode ? state && state?.stats?.purged_percentage_z_legend : country?.purged_percentage_z_legend;
    if (focusOn?.stateCode && zLegend) {
      return ['-2', '-1', '0', '1', '2'].map(z => ({
        dataKey: z,
        label: z === '0' ? `Average (State) Purged: ${zLegend[z].toFixed(2)}%` : `${zLegend[z].toFixed(2)}%`,
        color: colorForZ(Number(z)).toRgb()
      }));
    } else {
      console.log('country', country)
      return [
        { dataKey: '-2', label: 'Lower than 84%', color: colorForZ(-2).toRgb() },
        { dataKey: '-1', label: 'Lower than 50%', color: colorForZ(-1).toRgb() },
        { dataKey: '0', label: `Average (Country) Purged ${country?.purged_percentage.mean.toFixed(2)}%`, color: colorForZ(0).toRgb() },
        { dataKey: '1', label: 'Above 50%', color: colorForZ(1).toRgb() },
        { dataKey: '2', label: 'Above 84%', color: colorForZ(2).toRgb() },
      ];
    }
  }, [focusOn?.stateCode, states, country?.purged_percentage_z_legend]);
  const zLegendTitle = React.useMemo(() => {
    const state = focusOn?.stateCode && states.$find('code', focusOn.stateCode) as Maybe<PrivateState>;
    if (state) {
      return 'Compared to state average purge rate: ' +  typeof(state) !== 'undefined' && (state! as PrivateState).stats.purged_percentage.mean
    } else {
      return `Compared to state's average purge rate`;
    }
  }, [zLegend, states.length]);

  if (focusOn?.stateCode) {
    return <div className="country-county w-full h-auto max-w-full overflow-hidden">
      <CountiesSVG />
      <div className="flex flex-wrap gap-4 justify-center items-center">
            {zLegend && zLegend.map((item) => {
              const key = item.dataKey;

              return (
                <div
                  key={item.dataKey}
                  className="flex items-center gap-2.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
                >
                  <div
                    className="h-3 w-2 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                  {item?.label}
                </div>
              );
            })}
          </div>
    </div>;
  } else {
    return (
      <>
        <div className="hidden lg:block w-full h-auto max-w-full overflow-hidden country-county">
          <CountiesSVG />
          {zLegendTitle && <b>{zLegendTitle}</b>}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            {zLegend && zLegend.map((item) => {
              const key = item.dataKey;

              return (
                <div
                  key={item.dataKey}
                  className="flex items-center gap-2.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
                >
                  <div
                    className="h-3 w-2 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                  {item?.label}
                </div>
              );
            })}
          </div>

        </div>
        <div className="block lg:hidden w-full country-state">
          <StatesSVG />
        </div>
      </>
    );
  }
};

export default CountryMap;