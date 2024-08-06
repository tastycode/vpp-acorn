"use client";

import CountryMap from '@/app/components/CountryMap';
import { ChartData as InternalChartData, ChartDataset, Nullable, PrivateState, PublicStateScorecard, StateCode, ChartStats, PrivateCounty } from '@/app/counties/types';
import { useRouter } from 'next/router';
import { getCommonServerSideProps } from '@/pages';
import { statesAtom } from '@/states/atoms';
import Link from 'next/link'
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bar, Doughnut } from 'react-chartjs-2';

import { barChartOptionsFrom, chartDataFrom, doughnutChartOptionsFrom, getChartData } from '@/app/utils';
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { RouteLoader } from '@/app/components/RouteLoader';
import { useAtom } from 'jotai';

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
    { type: "Bar", paths: ["stae.age.total", "state.age.new", "state.age.drop"] },
    { type: "Donut", paths: ["state.status.total"] }
  ],
  [
    { type: "Bar", paths: ["state.party.total", "state.party.new", "state.party.drop"] },
    { type: "Donut", paths: ["state.party.total"] }
  ],
  [
    { type: "Bar", paths: ["state.sex.total", "state.sex.new", "state.sex.drop"] },
    { type: "Bar", paths: ["state.race.total", "state.race.new", "state.race.drop"] }
  ],
  [
    { type: "Bar", paths: ["state.status.new", "state.status.drop"] },
    { type: "HorizontalBar", paths: ["state.race.new", "state.race.drop"] }
  ]
];



const VPPScoreHeader = ({ scorecard }: { scorecard: PublicStateScorecard }) => {
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
      <h3 className="font-bold text-red-600 dark:text-white">{title} <span>{'⭐️'.repeat(stars)}</span></h3>
      {items.filter(item => item.value).map((item, index) => (
        <div key={index} className="mt-1">
          <p className="font-semibold">{item.desc}</p>
          <p className="mt-1 text-gray-500 dark:text-gray-3000 italic">{item.value}</p>
        </div>
      ))}
    </div>
  );
};

const VPPScoreCard = ({ scorecard }) => {
  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-500 shadow-md rounded-lg overflow-hidden">
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
      <div className="bg-white dark:bg-slate-500 shadow-md rounded-lg overflow-hidden">
        <div className="bg-blue-600 text-white text-center p-4 font-bold">
          Registered Voters in {state.name}
        </div>
        <div className="text-center text-red-600 font-bold p-4">
          {totalVoters.toLocaleString()}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-500 shadow-md rounded-lg overflow-hidden">
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

  // Fetch data for the specified state from the API
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

const renderChart = (chartConfig: any, chartDatasets: InternalChartData[]) => {
  if (chartDatasets.length === 0 || chartDatasets[0].datasets[0].data.length === 0) return null;

  const chartData = chartDataFrom(chartDatasets[0]);
  const options = chartConfig.type === 'Donut'
    ? doughnutChartOptionsFrom(chartDatasets[0])
    : barChartOptionsFrom(chartDatasets[0], chartConfig.type === 'HorizontalBar');

  // Modify the chartData to include colors
  const coloredChartData = {
    ...chartData,
    datasets: chartData.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.data.map((_, i) => getColor(i, dataset.label?.toLowerCase() || '')),
    }))
  };

  // Add responsive option to maintain aspect ratio
  const responsiveOptions = {
    ...options,
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full h-[400px]">
      {chartConfig.type === 'Donut'
        ? <Doughnut options={responsiveOptions as ChartJSOptions<'doughnut'>} data={coloredChartData as ChartJSData<'doughnut'>} />
        : <Bar options={responsiveOptions as ChartJSOptions<'bar'>} data={coloredChartData as ChartJSData<'bar'>} />
      }
    </div>
  );
};

let columns: ColumnDef<PrivateCounty>[] = []

const StatePage: React.FC<StatePageProps> = ({ stateIndex, state }) => {
  const router = useRouter();
  const { stateCode } = router.query as { stateCode: StateCode; };
  const [states, _] = useAtom(statesAtom);
  columns = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="state" />
      ),
      cell: ({ row }) => {
        const county = row.original;
        return <Link className="text-blue-600 underline hover:text-blue-800" href={`/states/${county.stateCode}/county/${county.name}`}>{county.name}</Link>;
      },
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
      cell: ({ column, row}) => {
        const amount = parseFloat(row.getValue("purged_percentage"))
            var formatter = new Intl.NumberFormat("en-US", {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2

            });
            const purgedPercentage = formatter.format(amount);
          return <Badge>
            {purgedPercentage}
          </Badge>
      },
    },
  ];
  let scorecardCategories = state?.scorecard?.categories ?? []
  return (
    <RouteLoader checkLoaded={() => scorecardCategories !== undefined} checkDependencies={[scorecardCategories]}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Outer container */}
        <div className="space-y-8"> {/* Vertical stack for sections */}
          {/* Top section with VPPScoreCard, CountryMap, and VoterStatsCard */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/states">States</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1">
                    {state?.name}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {states.map((state) => {
                      return <DropdownMenuItem key={state.code} className="bg-white dark:bg-slate-500 text-base dark:text-white">
                        <Link href={`/states/${state.code}`}>{state.name}</Link>
                      </DropdownMenuItem>
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="w-full">
              {state.scorecard && <VPPScoreCard scorecard={state.scorecard} />}
            </div>
            <div className="w-full">
              <h1>{state?.name}</h1>
              <CountryMap focusOn={{ stateCode }} />
            </div>
            <div className="w-full">
              <VoterStatsCard state={state} />
            </div>
          </div>

          {/* Charts section */}
          {chartLayout.map((row, rowIndex) => (
            <div key={rowIndex} className={`grid grid-cols-1 ${row.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
              {row.map((chartConfig, colIndex) => (
                <div key={colIndex} className="w-full h-[400px]">
                  {(() => {
                    const chartDatasets = chartConfig.paths
                      .filter(path => state.chartStats)
                      .map(path => getChartData(path, state.chartStats!))
                      .filter((data): data is InternalChartData => data !== null);

                    return renderChart(chartConfig, chartDatasets);
                  })()}
                </div>
              ))}
            </div>
          ))}

          {/* DataTable section */}
          <div className="w-full">
            <DataTable columns={columns} data={state.counties} filterColumn="name" />
          </div>
        </div>
      </div>
    </RouteLoader>
  );
};

export default StatePage;