import { featureStats } from "@/app/utils";
import { PublicStateScorecard, PublicStates, PrivateCounty, PrivateState } from "@/app/counties/types";

export function processData(initialStatesData: PublicStates['states'], stateScorecards: PublicStateScorecard[]) {
  const counties: PrivateCounty[] = [];
  const privateStates: PrivateState[] = [];

  for (const state of initialStatesData) {
    const stateFips = state.code;
    const stateCode = state.abv;

    const stateCounties: PrivateCounty[] = Object.keys(state.counties).map(countyFips => {
      const county = state.counties[countyFips];
      return {
        ...county,
        purged_percentage: county.purged_percentage == null ? null : parseFloat(county.purged_percentage),
        name: county.county,
        fips: countyFips,
        stateFips,
        stateCode
      };
    });

    counties.push(...stateCounties);

    const privateState : PrivateState = {
      ...state,
      code: stateCode,
      fips: stateFips,
      counties: stateCounties,
      stats: {
        average_total_voters: featureStats(stateCounties, "average_total_voters"),
        dropped_voters: featureStats(stateCounties, "dropped_voters"),
        purged_percentage: featureStats(stateCounties, "purged_percentage")
      }
    }
   const scorecard = stateScorecards.find(scorecard => scorecard.state == privateState.code);
   privateState.scorecard = scorecard === undefined ? null : scorecard
   privateStates.push(privateState)
  }

  const countryStats = {
    average_total_voters: featureStats(counties, "average_total_voters"),
    dropped_voters: featureStats(counties, "dropped_voters"),
    purged_percentage: featureStats(counties, "purged_percentage")
  };

  for (const [i, privateState] of privateStates.entries()) {
    const purgedPercentageCountryZ = (privateState.stats.purged_percentage.mean - countryStats.purged_percentage.mean) / countryStats.purged_percentage.std;
    for (const [j, privateCounty] of privateState.counties.entries()) {
      const purgedPercentageStateZ = (privateCounty.purged_percentage - privateState.stats.purged_percentage.mean) / privateState.stats.purged_percentage.std;
      const purgedPercentageCountryZ = (privateCounty.purged_percentage - countryStats.purged_percentage.mean) / countryStats.purged_percentage.std;
      privateStates[i].counties[j] = {
        ...privateStates[i].counties[j],
        purged_percentage_state_z: purgedPercentageStateZ,
        purged_percentage_country_z: purgedPercentageCountryZ
      };
    }
    privateStates[i] = {
      ...privateStates[i],
      stats: {
        ...privateStates[i].stats,
        purged_percentage_country_z: purgedPercentageCountryZ
      }
    };
  }

  return {
    country: countryStats,
    states: privateStates,
    counties
  };
}