import { ChartData, Nullable, SummaryStats } from "./counties/types";
import * as R from 'ramda'
const nj = require('numjs')

export const chartDataFrom = (chartData: ChartData) => {
    return {
        labels: chartData.categories,
        datasets: chartData.datasets.map((dataset) => {
            return {
                label: dataset.label,
                data: dataset.data,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            };
        }),
    };
};

export const chartOptionsFrom = (chartData: ChartData) => {
    return {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
        plugins: {
            title: {
                display: true,
                text: chartData.subtitle
            },
        },
    };
};

export const featureStats = (dataset: Record<string, any>, column: string) : SummaryStats => {
  const values = dataset.map(R.prop(column));
  console.log(column, dataset, 'values', values)
  const arr = nj.array(values.map((val : Nullable<number>) => val == null ? 0 : val));
  return {
    count: values.length,
    sum: arr.sum(),
    mean: arr.mean(),
    std: arr.std(),
  };
};
