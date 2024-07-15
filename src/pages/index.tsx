import { PublicStateScorecard, PublicStates } from "@/app/counties/types";
import CountryMap from "../app/components/CountryMap";
import {processData} from "@/utils/processData";
const fs = require('fs')
import Link from 'next/link'



export default function Home() {
  return (
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Where Purges are Happening?
        </p>
        <CountryMap />
        <Link href="/states">View All States</Link>
      </div>
  );
}

async function getStateScorecards(fs: any): Promise<PublicStateScorecard[]> {
  try {
    return fetch('https://back9.voterpurgeproject.org:8443/api/public/state_scorecard').then(response => response.json() as Promise<PublicStateScorecard[]>);
  } catch (e) {
    console.error('native fetch for getStateScorecards failed', e);
    return JSON.parse(fs.readFileSync('./samples/state_scorecard.json', 'utf-8')) as PublicStateScorecard[];
  }
}

async function getCountryIndex(fs: any): Promise<PublicStates> {
  try {
    return fetch('https://back9.voterpurgeproject.org:8443/api/public/us_dataset').then(response => response.json() as Promise<PublicStates>);
  } catch (e) {
    console.error('native fetch for getCountryIndex failed', e);
    return JSON.parse(fs.readFileSync('./samples/us_dataset.json', 'utf-8')) as PublicStates;
  }
}

export async function getCommonServerSideProps(fs: any) {
  const [stateScorecards, stateIndex] = await Promise.all([
    getStateScorecards(fs),
    getCountryIndex(fs)
  ]);

  const { country, states, counties } = processData(stateIndex.states, stateScorecards);

  const commonServerSideProps = {
    props: {
      country,
      states,
      counties
    },
  };
  return commonServerSideProps;
}

export async function getServerSideProps() {
  return getCommonServerSideProps(fs);
}
