import { readFileSync, writeFileSync } from "fs";
import path from "path";

// Define the input and output paths
//
const file = process.argv[2];
const inputFilePath = file;
const outputDir = path.dirname(file);

// Read the input file
const data = readFileSync(inputFilePath, "utf-8");

// Parse the JSON data
const geoJson = JSON.parse(data);

// Ensure the top-level type is FeatureCollection
if (geoJson.type !== "FeatureCollection" || !Array.isArray(geoJson.features)) {
  throw new Error("Invalid GeoJSON format");
}

// Function to write GeoJSON file for a state
const writeGeoJsonForState = (stateAbbr: string, features: any[]) => {
  const stateGeoJson = {
    type: "FeatureCollection",
    features: features.map((feature) => ({
      type: "Feature",
      properties: {
        STATEFP10: feature.properties.STATEFP10,
        COUNTYFP10: feature.properties.COUNTYFP10,
        NAME10: feature.properties.NAME10,
        NAMELSAD10: feature.properties.NAMELSAD10,
        INTPTLAT10: feature.properties.INTPTLAT10,
        INTPTLON10: feature.properties.INTPTLON10,
        STATE: feature.properties.state,
      },
      geometry: feature.geometry,
    })),
  };

  const outputFilePath = path.join(
    outputDir,
    `${stateAbbr.toLowerCase()}_counties.json`,
  );
  writeFileSync(outputFilePath, JSON.stringify(stateGeoJson, null, 2));
};

// Group features by state
const featuresByState: { [key: string]: any[] } = {};

geoJson.features.forEach((feature: any) => {
  const stateAbbr = feature.properties.state;
  if (!featuresByState[stateAbbr]) {
    featuresByState[stateAbbr] = [];
  }
  featuresByState[stateAbbr].push(feature);
});

// Write GeoJSON files for each state
Object.keys(featuresByState).forEach((stateAbbr) => {
  writeGeoJsonForState(stateAbbr, featuresByState[stateAbbr]);
});

console.log("GeoJSON files created successfully");
