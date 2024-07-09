"use client";

import CountryMap from '@/app/components/CountryMap';
import { ChartData, ChartDataset, Nullable, PrivateCounty, PrivateState, PublicStateScorecard, StateCode, ChartStats } from '@/app/counties/types';
import { useRouter } from 'next/router';
import { getCommonServerSideProps } from '@/pages';
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
import { chartDataFrom, chartOptionsFrom } from '@/app/utils';
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);


const columns: ColumnDef<PrivateCounty>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="County" />
        ),
    },
    {
        accessorKey: "average_total_voters",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Voters" />
        ),
    },
    {
        accessorKey: "dropped_voters",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Dropped" />
        ),
    },
    {
        accessorKey: "purged_percentage",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Purged %" />
        ),
    }
]

const VPPScoreHeader = ({scorecard}: {scorecard: PublicStateScorecard}) => {
    return (
        <div className="bg-red-600 text-white p-4 text-center">
            VPP Score: <Badge className="ml-1">
                {'⭐️'.repeat(parseInt(scorecard.stars))}
            </Badge>
        </div>
    );
};


const Section = ({ title, stars, items }) => {
    return (
        <div className="p-4 border-b last:border-b-0">
            <h3 className="font-bold text-red-600">{title} <span>{'⭐️'.repeat(stars)}</span></h3>
            {items.filter(item => item.value).map((item, index) => (
                <div key={index} className="mt-1">
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
            <VPPScoreHeader scorecard={scorecard} />
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

const VoterStatsCard = ({ state }) => {
    const totalVoters = state.stats.average_total_voters.sum;
    const droppedVoters = state.stats.dropped_voters.sum;
    const percentageDropped = ((droppedVoters / totalVoters) * 100).toFixed(2);

    return (
        <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-blue-600 text-white text-center p-4 font-bold">
                    Registered Voters in Missouri
                </div>
                <div className="text-center text-red-600 font-bold p-4">
                    {totalVoters.toLocaleString()}
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-red-600 text-white text-center p-4 font-bold">
                    Voters Purged (since last report)
                </div>
                <div className="text-center text-red-600 font-bold p-4">
                    {droppedVoters.toLocaleString()} <span className="text-gray-500 ">({percentageDropped}%)</span>
                </div>
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
    const { country, states, counties } = commonProps.props
    const { stateCode } = context.params as { stateCode: StateCode; };
    const url = `https://back9.voterpurgeproject.org:8443/api/public/state_charts?state=${stateCode}&start_date=2023-01-01&end_date=2025-01-01`
    const stateStats = await (await fetch(url)).json() as ChartStats;
    const matchState = states.find(state => state.code == stateCode)
    if (!matchState) return null;
    const stateIndex = states.indexOf(matchState)
    states[stateIndex] = {
        ...matchState,
        chartStats: stateStats
    }

    // Fetch data for the specified county from the API
    const stateServerSideProps = {
        props:
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
                <div className="w-full">
                    {state.scorecard && <VPPScoreCard scorecard={state.scorecard} />}
                </div>
                <div className="w-full">
                    <h1>State: {state?.name}</h1>
                    <CountryMap focusOn={{ stateCode }} />
                </div>
                <div className="w-full">
                    <VoterStatsCard state={state} />
                </div>
            </div>
            {(state?.chartStats?.datasets ?? []).map((stateStat: ChartDataset) => {
                return <>
                    <h2>{stateStat.title}</h2>
                    {stateStat.data.map((data: ChartData) => {
                        return <Bar key={data.cat2} options={chartOptionsFrom(data)} data={chartDataFrom(data)} />
                    })}
                </>
            })}
            <DataTable columns={columns} data={state.counties} />

        </div>
            );
};

            export default StatePage;
