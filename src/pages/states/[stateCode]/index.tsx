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
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );



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
        <div>
            <h1>State: {state?.name}</h1>
            <CountryMap focusOn={{stateCode}}/>
            <div className="state-scorecard">
            <pre> ∑ {JSON.stringify(state?.scorecard)} ∆</pre>
                <div className="state-scorecard--header">
                VPP Score: {scorecardCategories.reduce((acc,i) => {
                    const stars = parseInt(i.stars)
                    if (!isNaN(stars)) {
                        console.log(i, stars)
                        acc += stars
                    }
                    return acc
                },0) / scorecardCategories.length
            }
                </div>
                {scorecardCategories.map((category) =>
                    <div className="state-scorecard-section">
                        <h2>{category.name}</h2>
                        <div className="state-scorecard-section--star">
                            {category.stars}
                        </div>
                        <div className='state-scorecard-section--items'>
                            {category.items.map((item) => {
                                return <div className='state-scorecard-section--item'>
                                    <h3>{item.name}</h3>
                                    <p>{item.desc}</p>
                                    <b>{item.value}</b>
                                </div>
                            })}

                        </div>
                    </div>
                )}


            </div>
{(state?.chartStats?.datasets ?? []).map((stateStat: ChartDataset) => {
    return <>
    <h2>{stateStat.title}</h2>
    {stateStat.data.map((data: ChartData) => {
        return <Bar options={chartOptionsFrom(data)} data={chartDataFrom(data)}/>
})}
</>})}

            <pre>
                {JSON.stringify(state, null, 2)}
            </pre>
            {/* Add other relevant data and structure */}
        </div>
    );
};

export default StatePage;
