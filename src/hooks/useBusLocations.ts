import { useState, useEffect, useCallback, useRef } from "react";
import { fetchBusLocations } from "@/services/busLocationService";
import type { Route, BusLocation } from "@/types/route";

type Status = "idle" | "loading" | "success" | "error";

const REFRESH_INTERVAL_MS = 15000; // TAGO 데이터 갱신주기(10~20초)에 맞춤

export function useBusLocations(route: Route | null) {
  const [data, setData] = useState<BusLocation[] | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (isBackground: boolean) => {
      if (!route) return;
      if (!isBackground) setStatus("loading");

      try {
        const locations = await fetchBusLocations(route);
        setData(locations);
        setStatus("success");
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
        if (!isBackground) setStatus("error");
      }
    },
    [route]
  );

  useEffect(() => {
    setData(null);
    setLastUpdated(null);

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!route) {
      setStatus("idle");
      return;
    }

    load(false);
    intervalRef.current = setInterval(() => load(true), REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [route, load]);

  return { data, status, error, lastUpdated, retry: () => load(false) };
}