"use client";

import { useEffect, useState } from 'react'
import CountryMap from '@/app/components/CountryMap';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useAtom } from 'jotai';
import { statesAtom, countiesAtom } from '@/states/atoms';
import { ChartStats, ChartDataset, ChartData as InternalChartData, StateCode, PrivateCounty, PrivateState } from '@/app/counties/types';
import { getStateServerSideProps } from '@/pages/states/[stateCode]';
import fs from 'fs'
import { Chart as ChartJS, ChartData as ChartJSData, ChartOptions as ChartJSOptions, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { barChartOptionsFrom, doughnutChartOptionsFrom, chartDataFrom, getChartData } from '@/app/utils';


ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CountyPageProps {
    county: PrivateCounty;
    state: PrivateState;
}

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

const renderChart = (type: string, datasets: InternalChartData[], options: ChartJSOptions) => {
    if (datasets.length === 0) return null;
  
    const chartJSData = {
      labels: datasets[0].categories,
      datasets: datasets.map((d, index) => ({
        label: d.subtitle,
        data: d.datasets[0].data,
        backgroundColor: d.datasets[0].data.map((_, i) => getColor(i, d.cat2)),
      })),
    };
  
    const commonOptions: ChartJSOptions = {
      ...options,
      responsive: true,
      maintainAspectRatio: false,
    };
  
    switch (type) {
      case "Bar":
      case "StackedBar":
      case "HorizontalBar":
        const barOptions: ChartJSOptions<'bar'> = {
          ...commonOptions,
          scales: {
            x: {
              beginAtZero: true,
            },
            y: {
              beginAtZero: true,
            },
          },
        };
        if (type === "HorizontalBar") {
          barOptions.indexAxis = 'y';
        }
        return <Bar data={chartJSData} options={barOptions as ChartJSOptions<'bar'>} />;
      case "Donut":
        const doughnutOptions: ChartJSOptions<'doughnut'> = {
          ...commonOptions,
          cutout: '50%',
        } as ChartJSOptions<'doughnut'>;
        return <Doughnut data={chartJSData} options={doughnutOptions as ChartJSOptions<'doughnut'>} />;
      default:
        return null;
    }
  };

const CountyPage: React.FC<CountyPageProps> = ({ county, state }: CountyPageProps) => {
    const router = useRouter();
    const { stateCode, countyName } = router.query as { stateCode: string; countyName: string };

    const chartLayout = [
        [
            { type: "Bar", paths: ["county.age.total", "county.age.new", "county.age.drop"] },
            { type: "Donut", paths: ["county.status.total"] }
        ],
        [
            { type: "Bar", paths: ["county.party.total", "county.party.new", "county.party.drop"] },
            { type: "Donut", paths: ["county.party.total"] }
        ],
        [
            { type: "Bar", paths: ["county.sex.total", "county.sex.new", "county.sex.drop"] },
            { type: "Bar", paths: ["county.race.total", "county.race.new", "county.race.drop"] }
        ]
    ];
     return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">County: {county.name}, State: {state.code}</h1>
                        <CountryMap focusOn={{countyName, stateCode}}/>
                    </div>
                    <div>
                        {/* Add a summary or additional info about the county here */}
                    </div>
                </div>


                {chartLayout.map((row, rowIndex) => (
    <div key={rowIndex} className={`grid grid-cols-1 ${row.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
        {row.map((chartConfig, colIndex) => {
            const chartDatasets = chartConfig.paths
                .filter(path => county.chartStats)
                .map(path => getChartData(path, county.chartStats!))
                .filter((data): data is InternalChartData => data !== null);
            
            if (chartDatasets.length === 0) return null;
        
            return (
                <div key={colIndex} className="w-full h-[400px]">
                    <h2 className="text-center mb-2">{chartConfig.type} Chart</h2>
                    {chartConfig.type === 'Donut' 
                        ? <Doughnut 
                            options={doughnutChartOptionsFrom(chartDatasets[0])} 
                            data={chartDataFrom(chartDatasets[0]) as ChartJSData<'doughnut', number[], unknown>} 
                          />
                        : <Bar 
                            options={barChartOptionsFrom(chartDatasets[0], chartConfig.type === 'HorizontalBar')} 
                            data={chartDataFrom(chartDatasets[0]) as ChartJSData<'bar'>} 
                          />
                    }
                </div>
            );
        })}
    </div>
))}

            </div>
        </div>
    );

};

export default CountyPage;