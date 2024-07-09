"use client";

import CountryMap from '@/app/components/CountryMap';
import { ChartData, ChartDataset, Nullable, PrivateState, PublicStateScorecard, StateCode, StateData, StateStats } from '@/app/counties/types';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getCommonServerSideProps } from '@/pages';
import { statesAtom } from '@/states/atoms';
const fs = require('fs')
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
  import { Bar } from 'react-chartjs-2';
import * as R from 'ramda'
import { chartDataFrom, chartOptionsFrom } from '@/app/utils';
import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );


  const VPPScoreHeader = (scorecard: PublicStateScorecard) => {
    return (
      <div className="bg-red-600 text-white p-4 text-center">
        VPP Score: <Badge className="ml-1">
            {Array.from({length: parseInt(scorecard.stars)}, () => "⭐").join("")}
            </Badge>
      </div>
    );
  };
  import React from 'react';

  const Section = ({ title, stars, items }) => {
    return (
      <div className="p-4 border-b last:border-b-0">
        <h3 className="text-lg font-bold text-red-600">{title} <span>{'⭐️'.repeat(stars)}</span></h3>
        {items.filter(item => item.value).map((item, index) => (
          <div key={index} className="mt-2">
            <p className="font-semibold">{item.desc}</p>
            <p className="mt-1 text-gray-500 italic">{item.value}</p>
          </div>
        ))}
      </div>
    );
  };
  
  const VPPScoreCard = ({ scorecard }) => {
    return (
      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <VPPScoreHeader scorecard={scorecard}/>
        <div className="divide-y">
          {scorecard.categories.map((category, index) => (
            <Section 
              key={index}
              title={category.name}
              stars={category.stars}
              items={category.items}
            />
          ))}
        </div>
      </div>
    );
  };



interface StatePageProps {
    stateIndex: number,
    state: PrivateState
}
export const getStateServerSideProps = async (context, fs) => {
    const commonProps = await getCommonServerSideProps(fs);
    const { country, states, counties} = commonProps.props
    const { stateCode } = context.params as { stateCode: StateCode; };
    const url = `https://back9.voterpurgeproject.org:8443/api/public/state_charts?state=${stateCode}&start_date=2023-01-01&end_date=2025-01-01`
    console.log({url})
    const stateStats = await (await fetch(url)).json() as StateStats;
    const matchState = states.find(state => state.code == stateCode)
    if (!matchState) return null;
    const stateIndex = states.indexOf(matchState)
    states[stateIndex] =  {
        ...matchState,
        chartStats: stateStats
    }
 
    // Fetch data for the specified county from the API
    const stateServerSideProps = { props: 
        { 
            country, states, counties, state: states[stateIndex]
        } 
    };
    return stateServerSideProps;
}
export const getServerSideProps = async (context) => {
    return getStateServerSideProps(context, fs);
};

const StatePage: React.FC<StatePageProps> = ({ stateIndex, state }) => {
    const router = useRouter();
    const { stateCode } = router.query as { stateCode: StateCode; };
    let scorecardCategories = state?.scorecard?.categories ?? []
    return (
      <div className="z-10 max-w-5xl w-full flex-col items-center justify-between font-mono text-sm lg:flex">
            <h1>State: {state?.name}</h1>
            <CountryMap focusOn={{stateCode}}/>
        <div>
            {state.scorecard && <VPPScoreCard scorecard={state.scorecard}/>}
{(state?.chartStats?.datasets ?? []).map((stateStat: ChartDataset) => {
    return <>
    <h2>{stateStat.title}</h2>
    {stateStat.data.map((data: ChartData) => {
        return <Bar options={chartOptionsFrom(data)} data={chartDataFrom(data)}/>
})}
</>})}

            {/* Add other relevant data and structure */}
        </div>
      </div>
    );
};

export default StatePage;
