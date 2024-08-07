import { PrivateState } from "@/app/counties/types";
import { getCommonServerSideProps } from "@/pages/index"
import { statesAtom } from '@/states/atoms';
import { useAtom } from "jotai";
import fs from 'fs'
import * as R from 'ramda'
import React, { useEffect } from "react";
import Link from 'next/link'
import { useRouter } from 'next/router'
import { RouteLoader } from "@/app/components/RouteLoader";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type SortMode = "name" | "score"

export default function StatesPage({state}: {state: PrivateState}) {
    const [states] = useAtom(statesAtom)
    const router = useRouter()
    const sortMode = (router.query.sort as SortMode) || "name"

    useEffect(() => {
        if (!router.query.sort) {
            router.replace({
                pathname: router.pathname,
                query: { ...router.query, sort: sortMode },
            }, undefined, { shallow: true })
        }
    }, [router, sortMode])

    const sortedStates = React.useMemo(() => R.sortBy((state: PrivateState) => {
        return sortMode === 'name' ? state.name : -(state.scorecard?.stars || 0)
    })(states), [states, sortMode])

    const handleSort = (mode: SortMode) => {
        router.push({
            pathname: router.pathname,
            query: { ...router.query, sort: mode },
        }, undefined, { shallow: true })
    }

    return (
        <RouteLoader checkLoaded={() => states.length > 0} checkDependencies={[states]}>
            <div className="container mx-auto px-4">
            <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>

          <BreadcrumbLink href="/states">States</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1">
              {state?.name}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {states.map((state) => {
              return <DropdownMenuItem key={state.code} className="hite dark:bg-slate-500 text-base dark:text-white">
                <Link href={`/states/${state.code}`}>{state.name}</Link>
              </DropdownMenuItem>
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
                <h1 className="text-2xl font-bold mb-4">State Score Cards</h1>
                <p className="mb-4">The Voter Purge Project is currently monitoring 38 states for disenfranchised voters. Each state in the list below is scored by the following criteria on a one to three star scale, transparency, access to data and human resources, and the state's recorded history of purging its voter rolls.</p>

                <div className="mb-4 flex justify-end space-x-2">
                    <button
                        onClick={() => handleSort('name')}
                        className={`px-4 py-2 rounded ${sortMode === 'name' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        Sort by Name
                    </button>
                    <button
                        onClick={() => handleSort('score')}
                        className={`px-4 py-2 rounded ${sortMode === 'score' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        Sort by VPP Score
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {sortedStates.map((state: PrivateState) => (
                        <div key={state.code} className={`rounded-lg overflow-hidden shadow-md ${getScoreCardColor(state.scorecard?.stars!)}`}>
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-lg font-semibold">{state.name}</h2>
                                    <div className="text-sm font-medium">VPP Score: {getStars(state.scorecard?.stars!)}</div>
                                </div>
                                {state?.stats?.average_total_voters?.mean && <>
                                    <div className="text-sm mb-1">
                                        <span className="font-medium">{state.stats.average_total_voters.mean.toLocaleString()} total voters</span>
                                    </div>
                                    <div className="text-sm mb-2">
                                        <span className="text-red-600 font-medium">{state.stats.dropped_voters.mean.toLocaleString()} voters purged</span> (since last report)
                                    </div>
                                    <div className="text-sm font-bold mb-2">
                                        {state.stats.purged_percentage.mean.toFixed(2)}%
                                    </div>
                                </>
                                }
                                <div className="flex justify-between items-center">
                                    <Link href={`/states/${state.code}`} className="text-blue-600 hover:underline text-sm">
                                        More Metrics
                                    </Link>
                                    <div className="text-xs text-gray-500">
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </RouteLoader>
    )
}

function getScoreCardColor(stars: string | undefined) {
    switch (stars) {
        case "1": return 'bg-red-100';
        case "2": return 'bg-yellow-100';
        case "3": return 'bg-green-100';
        default: return 'bg-gray-100';
    }
}

function getStars(count: string | undefined) {
    const starCount = parseInt(count ?? '0')
    return '★'.repeat(starCount || 0) + '☆'.repeat(3 - (starCount || 0));
}

export async function getServerSideProps() {
    return getCommonServerSideProps(fs);
}
