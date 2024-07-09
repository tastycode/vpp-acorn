"use client";

import { useEffect, useState       } from 'react'
import CountryMap from '@/app/components/CountryMap';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useAtom } from 'jotai';
import { statesAtom, countiesAtom } from '@/states/atoms';
import { StateData, ChartStats, ChartDataset, ChartData, StateCode, PrivateCounty, PrivateState} from '@/app/counties/types';
import { getStateServerSideProps } from '@/pages/states/[stateCode]';
import fs from 'fs'
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
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
import { chartDataFrom, chartOptionsFrom } from '@/app/utils';
interface CountyData {
    population: number;
    // Add other properties relevant to your data model
}

interface CountyPageProps {
    county: PrivateCounty;
    state: PrivateState;
}

const findStateData = (stateName: string, statesData: StateData[]) : StateData => {
    return statesData.find(state => state.code === stateName)!;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { stateCode, countyName } = context.params as { stateCode: StateCode; countyName: string };

    const {country, states, counties, state} = (await getStateServerSideProps(context, fs))?.props!;

    // Fetch data for the specified county from an API: example: https://back9.voterpurgeproject.org:8443/api/public/county_charts?state=MO&county=225&start_date=2023-01-01&end_date=2024-01-01
    // note that county.fips is a 5 digit code which includes the state code as the first two digits, this API requires just the last 3 digits

    const county = state.counties.find((county : PrivateCounty) => county.name == countyName)!
    const url = `https://back9.voterpurgeproject.org:8443/api/public/county_charts?state=${state.code}&county=${county.fips}&start_date=2023-01-01&end_date=2025-01-01`
    const countyChartStats = (await (await fetch(url)).json()) as ChartStats
    county.chartStats = countyChartStats
    return { props: {
        country,
        states,
        counties,
        state,
        county
    } };
};

const CountyPage: React.FC<CountyPageProps> = ({ county, state}: CountyPageProps) => {
    const router = useRouter();
    const { stateCode, countyName } = router.query as { stateCode: string; countyName: string };

    const [statesData] = useAtom(statesAtom);
    const [countiesData] = useAtom(countiesAtom);



    return (
        <div>
            <h1>County: {county.name}, State: {state.code}</h1>

            <CountryMap focusOn={{countyName, stateCode}}/>

{county.chartStats && county.chartStats?.datasets.map((countyStat: ChartDataset) => {
    return <>
    <h2>{countyStat.title}</h2>
    {countyStat.data.map((data: ChartData) => {
        return <Bar key={data.cat2} options={chartOptionsFrom(data)} data={chartDataFrom(data)}/>
})}
</>})}

        </div>
    );
};

export default CountyPage;
