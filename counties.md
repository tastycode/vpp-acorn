County SVG map was sourced from

https://en.wikipedia.org/wiki/File:USA_Counties.svg#:~:text=English-,This%20is%20a%20map%20of%20the%20United%20States%20showing%20the,and%20counties%20in%20high%20detail.

The SVG elements were annotated with fips codes via the following snippet ran in the console after running a local HTTP server in the repo root `python -m http.server`

```
const counties = await (await fetch('/src/app/counties/index.json')).json(); for (const stateEl of document.querySelectorAll('g#counties > g')) { const stateName = stateEl.id.replace("_"," "); for (const countyEl of stateEl.querySelectorAll('g > path')) { const [countyName, stateCode] = countyEl.querySelector('title').innerHTML.split(', '); const county = counties.find( c => c.State_Abv == stateCode && c.County == countyName); countyEl.setAttribute('data-state_code', stateCode); countyEl.setAttribute('data-county_name', countyName);       countyEl.setAttribute('data-state_name', stateName); county && countyEl.setAttribute('data-county_fips', county?.FIPS_County.padStart(3, '0')); county && countyEl.setAttribute('data-state_fips', county?.FIPS_State.padStart(2, '0'))}
```

The SVG element was found in the elements panel, right-click > copy outerHTML. The SVG content was repasted into the `/src/app/counties/index.svg`
