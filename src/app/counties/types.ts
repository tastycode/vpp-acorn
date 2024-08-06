import states from "./states.json";
import { IndexedArray } from '@/utils/indexedArray'
export type Maybe<T> = T | null | undefined;
export type Nullable<T> = T | null;

export type StateCode = keyof typeof states;

export type CountyFormerData = {
  FIPS_State: string;
  FIPS_County: string;
  County: string;
  count: string;
  key_count: string;
  key_pct: string;
};

export type CountyData = {
  county: string;
  fips: string;
  purged_pcnt: number;
  total_voters: number;
  purged_voters: number;
};

export type StateData = {
  state: (typeof states)[StateCode];
  code: keyof typeof states;
  fips: string;
  counties: CountyData[];
  scorecard?: PublicStateScorecard
};

export type CountyIndexResponse = {
  snapshot_count: number;
  snapshot_latest: string;
  states: StateData[];
};
export interface CountyStats {
  code: string;
  name: string;
  end_date: string;
  county: string;
  cat1: string;
  datasets: ChartDataset[];
  fips: string;
  abv: string;
  start_date: string;
}
export interface ChartStats {
  code: string;
  name: string;
  cat1: string;
  end_date: string;
  datasets: ChartDataset[]
}

export interface ChartDataset {
  cat3: string;
  data: ChartData[];
  title: string;
}

export interface ChartData {
  cat2: string;
  datasets: ChartDatasetEntry[];
  subtitle: string;
  categories: string[];
  dp: number;
}

export interface ChartDatasetEntry {
  data: number[];
  label: string;
}

export interface PublicStates {
  states: PublicState[]
}

export interface PublicState {
  counties: {
    [countyFips: string]: PublicCounty
  };
  code: string;
  name: string;
  abv: StateCode;
}

export interface PrivateServerState extends Omit<PublicState, 'counties'> {
  counties: PrivateCounty[] // RIP Lishkov
  code: StateCode;
  fips: string;
  scorecard?: Nullable<PublicStateScorecard>
  stats: RegionalStats
  chartStats?: ChartStats
}

export interface PrivateState extends Omit<PrivateServerState, 'counties'> {
  counties: IndexedArray<PrivateCounty> // RIP Lishkov
  code: StateCode;
  fips: string;
  scorecard: Nullable<PublicStateScorecard>
  stats: RegionalStats
  chartStats?: ChartStats
}

export interface PublicCounty {
    county: string;
    average_total_voters: Nullable<number>;
    dropped_voters: Nullable<number>;
    new_voters: Nullable<number>;
    purged_percentage: Nullable<string>;
    fips?: string;
}

export interface PrivateCounty extends Omit<PublicCounty, 'county' | 'purged_percentage'> {
  name: string;
  stateFips: string;
  stateCode: StateCode;
  purged_percentage: Nullable<number>;
  purged_percentage_state_z?: number;
  purged_percentage_country_z?: number;
  chartStats?: ChartStats
}

export type PublicStateScorecard = {
  state: StateCode;
  categories: {
    items: {
      points: Nullable<number>;
      name: string;
      value: string;
      desc: string;
    }[];
    name: string;
    stars: string;
    altname: string;
  }[];
  stars: string;
};

export interface RegionalStats {
  average_total_voters: SummaryStats;
  purged_percentage: SummaryStats;
  dropped_voters: SummaryStats;
  purged_percentage_country_z?: number;
  purged_percentage_z_legend?: {
    [z: number]: number;
  };
}

export interface SummaryStats {
    sum: number
    count: number
    mean: number
    std: number
}

export type CountryMetadata = Nullable<RegionalStats>