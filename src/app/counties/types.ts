import states from "./states.json";
export type StateCode = keyof typeof states;

export type CountyFormerData = {
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
};

export type CountyIndexResponse = {
  snapshot_count: number;
  snapshot_latest: string;
  states: StateData[];
};
