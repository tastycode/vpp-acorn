import counties from "./index.json";
import states from "./states.json";
import * as R from "ramda";
import type {
  CountyFormerData,
  CountyData,
  CountyIndexResponse,
  StateCode,
} from "./types";

const formatCountyData = (countyData: CountyFormerData): CountyData => {
  return {
    fips:
      countyData["FIPS_State"].padStart(2, "0") +
      countyData["FIPS_County"].padStart(3, "0"),
    county: countyData["County"],
    total_voters: parseInt(countyData["count"]),
    purged_voters: parseInt(countyData["key_count"]),
    purged_pcnt: parseFloat(countyData["key_pct"]),
  };
};

export async function GET() {
  const stateCounties = R.groupBy(R.prop("State_Abv"), counties);
  // return ctx.db.select().from(schema.county).orderBy(desc(schema.post.id));
  return Response.json({
    snapshot_count: 1,
    snapshot_latest: "2020-02-13T00:00:00Z",
    states: (Object.keys(stateCounties) as StateCode[]).map((stateCode) => {
      const counties = stateCounties[stateCode]!;
      return {
        state: states[stateCode],
        code: stateCode,
        fips: counties[0]?.FIPS_State,
        counties: counties.map((countyData: CountyFormerData) => {
          return formatCountyData(countyData);
        }),
      };
    }),
  } as CountyIndexResponse);
}
