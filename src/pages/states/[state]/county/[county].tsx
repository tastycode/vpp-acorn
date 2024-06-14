"use client";

import { useEffect, useState       } from 'react'
import CountryMap from '@/app/components/CountryMap';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useAtom } from 'jotai';
import { statesAtom, countiesAtom } from '@/states/atoms';
import { StateData } from '@/app/counties/types';
import { getStateServerSideProps } from '@/pages/states/[state]';
interface CountyData {
    population: number;
    // Add other properties relevant to your data model
}

interface CountyPageProps {
    countyData: CountyData;
}

const findStateData = (stateName: string, statesData: StateData[]) : StateData => {
    return statesData.find(state => state.code === stateName)!;
}

const findCountyData = (countyName: string, stateData: StateData) => {
    return stateData.counties.find(county => county.county === countyName)
}
export const getServerSideProps: GetServerSideProps = async (context) => {
    const { state, county } = context.params as { state: string; county: string };
    const baseProps = await getStateServerSideProps(context);
    const { stateData } = baseProps.props as { stateData: StateData };
    const countyData = findCountyData(county, stateData);
    // Fetch data for the specified county from an API: example: https://back9.voterpurgeproject.org:8443/api/public/county_charts?state=MO&county=225&start_date=2023-01-01&end_date=2024-01-01
    // note that county.fips is a 5 digit code which includes the state code as the first two digits, this API requires just the last 3 digits
    const countyFips = countyData?.fips.substr(2);
    const response = await fetch(`https://back9.voterpurgeproject.org:8443/api/public/county_charts?state=${state}&county=${countyFips}&start_date=2023-01-01&end_date=2024-01-01`);
    return { props: {
        ...baseProps,
        countyData,
        countyStats: await response.json()
    } };
};

const CountyPage: React.FC<CountyPageProps> = ({ countyData: externalCountyData, countyStats }: {countyData: CountyData, countyStates: Record<string, any>}) => {
    const router = useRouter();
    const { state, county } = router.query as { state: string; county: string };

    const [statesData] = useAtom(statesAtom);
    const [countiesData] = useAtom(countiesAtom);
    const [countyData, setCountyData] = useState<CountyData | null>(externalCountyData);
    useEffect(() => {

        console.log({statesData, countiesData});
    }, [statesData, countiesData]);
    console.log({countiesData, statesData});


    useEffect(() => {
        if (!countyData) {
        const foundCountyData = findCountyData(county, findStateData(state!, statesData));
        if (foundCountyData) {
          setCountyData(foundCountyData);
        }
        }

    }, [state, county])

    return (
        <div>
            <h1>County: {county}, State: {state}</h1>

            <CountryMap focusOn={{county, state}}/>

            <pre>
                {JSON.stringify({externalCountyData, countyData, countyStats}, null, 2)}
            </pre>
            {/* Add other relevant data and structure */}
        </div>
    );
};

export default CountyPage;
