import { PrivateState } from "@/app/counties/types";
import { getCommonServerSideProps } from "@/pages/index"
import { statesAtom } from '@/states/atoms';
import { useAtom } from "jotai";
import fs from 'fs'
import * as R from 'ramda'
import { useState } from "react";

type SortMode = "name" | "score"

export default function StatesPage() {
    const [states] = useAtom(statesAtom)
    const [sortMode, setSortMode] = useState<SortMode>("name")
    const sortedStates = R.sortBy((state: PrivateState) => {
        return sortMode == 'name' ? state.name : state.scorecard!.stars
    })(states)

    return <div>
        <ul>
            {sortedStates.map((state: PrivateState) => <li>
                {state.name} VPP Score: {state.scorecard?.stars}
                <div>Total Voters: {state.stats.average_total_voters.mean}</div>
                <div>Total Purged: {state.stats.dropped_voters.mean}</div>
                <p>{state.stats.purged_percentage.mean}</p>
                <a href={`/states/${state.code}`}>More Stats</a>
            </li>)}
        </ul>
    </div>

}

export async function getServerSideProps() {
  return getCommonServerSideProps(fs);
}