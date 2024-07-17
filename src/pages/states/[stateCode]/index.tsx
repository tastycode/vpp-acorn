"use client";

import CountryMap from '@/app/components/CountryMap';
import { ChartData as InternalChartData, ChartDataset, Nullable, PrivateCounty, PrivateState, PublicStateScorecard, StateCode, ChartStats } from '@/app/counties/types';
import { useRouter } from 'next/router';
import { getCommonServerSideProps } from '@/pages';
const fs = require('fs')
import {
    ArcElement,
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions as ChartJSOptions,
    ChartData as ChartJSData
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

import { barChartOptionsFrom, chartDataFrom, doughnutChartOptionsFrom, getChartData} from '@/app/utils';
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const colorPalette = {
    total: 'rgba(54, 162, 235, 0.8)',
    dropped: 'rgba(255, 99, 132, 0.8)',
    new: 'rgba(75, 192, 192, 0.8)',
    other: [
      'rgba(255, 206, 86, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)',
      'rgba(255, 99, 255, 0.8)',
    ]
  };

const getColor = (index: number, type: string): string => {
    if (type in colorPalette) return colorPalette[type];
    return colorPalette.other[index % colorPalette.other.length];
  };
const chartLayout = [
    [
        {
            type: "Bar",
            paths: ["state.age.total"],
        },
    ], // 1 column
    [
        {
            type: "Donut",
            paths: ["state.age.drop"], // cat1, cat3, cat2
        },
        {
            type: "HorizontalBar",
            paths: ["state.age.new"],
        },
    ], // 2 columns on desktop
    [
        {
            type: "StackedBar",
            paths: ["state.party.total", "state.party.dropped", "state.party.new"]
        }
    ] // 1 column on desktop, 3 series in one all with same categories
];


const columns: ColumnDef<PrivateCounty>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="County" />
        ),
        filterFn: "includesString"
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
    const renderChart = (type: string, datasets: InternalChartData[], options: ChartJSOptions) => {
        if (datasets.length === 0) return null;
      
        const chartJSData = {
          labels: datasets[0].categories,
          datasets: datasets.map((d, index) => ({
            label: d.subtitle,
            data: d.datasets[0].data,
            backgroundColor: getColor(index, d.cat2),
          })),
        };
      
        const commonOptions: ChartJSOptions = {
          ...options,
          responsive: true,
          maintainAspectRatio: false,
        };
        console.log('rendering chart type', type)
      
        switch (type) {
          case "Bar":
          case "StackedBar":
          case "HorizontalBar":
            return <Bar data={chartJSData as ChartJSData<'bar'>} options={commonOptions as any} />;
          case "Donut":
            console.log("Rendering donut", chartJSData, commonOptions)
            return <Doughnut data={chartJSData as ChartJSData<'doughnut'>} options={commonOptions as any} />;
          default:
            return null;
        }
      };
      return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Outer container */}
          <div className="space-y-8"> {/* Vertical stack for sections */}
            {/* Top section with VPPScoreCard, CountryMap, and VoterStatsCard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
      
            {/* Charts section */}
            {chartLayout.map((row, rowIndex) => (
  <div key={rowIndex} className={`grid grid-cols-1 ${row.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
    {row.map((chartConfig, colIndex) => {
      const chartDatasets = chartConfig.paths
        .filter(path => state.chartStats)
        .map(path => getChartData(path, state.chartStats!))
        .filter((data): data is InternalChartData => {
            const result = data !== null
            return result
        });
      
      if (chartDatasets.length === 0) return null;
      if (chartDatasets[0].datasets[0].data.length == 0) return null;
  
    const chartData = chartDataFrom(chartDatasets[0]);
    return (
        <div key={colIndex} className="w-full h-[400px]">
            <h2 className="text-center mb-2">{chartConfig.type} Chart</h2>
            {chartConfig.type === 'Donut' 
                ? <Doughnut options={doughnutChartOptionsFrom(chartDatasets[0])} data={chartData as ChartJSData<'doughnut'>} />
                : <Bar options={barChartOptionsFrom(chartDatasets[0], chartConfig.type === 'HorizontalBar')} data={chartData as ChartJSData<'bar'>} />
            }
        </div>
    );
    })}
  </div>
))}
      
            {/* DataTable section */}
            <div className="w-full">
              <DataTable columns={columns} data={state.counties} filterColumn="name"/>
            </div>
          </div>
        </div>
      );
};

            export default StatePage;
