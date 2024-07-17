import { ChartStats, ChartData as InternalChartData, Nullable, SummaryStats } from "./counties/types";
import { ChartData as ChartJSData , ChartOptions as ChartJSOptions} from 'chart.js';


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
    return data;
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

  



export const featureStats = (dataset: Record<string, any>, column: string) : SummaryStats => {
  const values = dataset.map(R.prop(column));
  const arr = nj.array(values.map((val : Nullable<number>) => val == null ? 0 : val));
  return {
    count: values.length,
    sum: arr.sum(),
    mean: arr.mean(),
    std: arr.std(),
  };
};
