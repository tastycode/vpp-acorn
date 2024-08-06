import { ChartStats, ChartData as InternalChartData, Nullable, SummaryStats } from "./counties/types";
import { ChartData as ChartJSData, ChartOptions as ChartJSOptions } from 'chart.js';
import { Color } from "@fly-lab/color-magic";


import * as R from 'ramda'
const nj = require('numjs')

export const convertToChartJSData = (internalData: InternalChartData): ChartJSData => {
  return {
    labels: internalData.categories,
    datasets: internalData.datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    })),
  };
};

export const getChartData = (path: string, chartStats: ChartStats): InternalChartData | null => {
  const [cat1, cat3, cat2] = path.split('.');
  const dataset = chartStats.datasets.find(ds => ds.cat3 === cat3);
  if (!dataset) return null;
  const data = dataset.data.find(d => d.cat2 === cat2);
  if (!data) return null;
  return data.datasets[0].data.length == 0 ? null : data;
};


export const barChartOptionsFrom = (data: InternalChartData, isHorizontal: boolean = false): ChartJSOptions<'bar'> => {
  const baseOptions: ChartJSOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: data.subtitle,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (isHorizontal) {
    return {
      ...baseOptions,
      indexAxis: 'y' as const,
      scales: {
        x: {
          beginAtZero: true,
        },
      },
    };
  }

  return baseOptions;
};

export const doughnutChartOptionsFrom = (data: InternalChartData): ChartJSOptions<'doughnut'> => {
  return {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: data.subtitle,
      },
    },
    cutout: '50%',
  };
};

export const chartDataFrom = (data: InternalChartData): ChartJSData => {
  return {
    labels: data.categories,
    datasets: data.datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: (dataset as any).backgroundColor || 'rgba(75, 192, 192, 0.6)',
    })),
  };
};





export const featureStats = (dataset: Record<string, any>, columnOrFn: string | ((item: Record<string, any>) => any)): SummaryStats => {
  const values = R.pipe(
    R.filter((e: any) => e != null),
    R.map(typeof columnOrFn === 'string' ?
      R.prop(columnOrFn) : columnOrFn),
    R.filter((e: any) => e != null),
  )(dataset)
  let arr;
  try {
    arr = nj.array(values);
  } catch (e) {
    console.log(
      'columnOrFn', columnOrFn
    )
    console.log('values', values)
    console.log('error', e);
  }

  return {
    count: values.length,
    sum: arr.sum(),
    mean: arr.mean(),
    std: arr.std(),
  };
};

const meanHex = '#dddd66';

export const colorForZ = (z: number): Color => {
  // meanColor is hue 105. at 2 standard deviations higher purge, we want it to be
  // hue 0 (#dd6666) and 2 standard deviations under the mean purge we want it at
  // hue 205 (#66dd66) .  if z is -2, then -1 * -2 * 50  = 100. if z is 2 then -1 * 2 * 50 = -100
  const mean = new Color(meanHex);
  return mean.rotate(-1 * z * 50);
};


export const apiEndpoint = (path: string) => {
  const apiHost = process.env.VPP_API_BASE_URL ?? 'https://back9.voterpurgeproject.org:8443/api/public'
  return `${apiHost}${path}`
}