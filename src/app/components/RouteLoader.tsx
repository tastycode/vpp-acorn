import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Router from 'next/router';
import React, { useEffect } from 'react';
import { loadingAtom } from "@/states/atoms";
import { useAtom } from "jotai";
type RouteLoaderProps = {
    // checkLoaded takes the same arguments as useMemo, including the dependencies
    checkLoaded: Parameters<typeof React.useMemo>[0],
    checkDependencies: Parameters<typeof React.useMemo>[1]
    children: React.ReactNode
}
export function RouteLoader({checkLoaded, checkDependencies, children}: RouteLoaderProps) {
  const [loading, setLoading] = useAtom(loadingAtom);

  useEffect(() => {
    Router.events.on('routeChangeStart', () => setLoading(true));
    Router.events.on('routeChangeComplete', () => setLoading(false));
  }, []);
  const isLoaded = React.useMemo(checkLoaded, checkDependencies);
  useEffect(() => {
        setLoading(!isLoaded)
  }, [isLoaded])
  if (loading) {
    return <LoadingSpinner/>
  } else {
    return children
  }
}