import { getRoutes as fetchRoutesRaw, getRouteStops as fetchStopsRaw, type RawRouteField } from "@/api/jeonju";
import type { Route, BusStop } from "@/types/route";

function formatTime(raw?: string): string {
  if (!raw) return "-";
  const padded = raw.padStart(4, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
}

function mapToRoute(raw: RawRouteField): Route {
  return {
    id: raw.brtStdid ?? "",
    number: raw.brtId ?? "",
    class: raw.brtClass ?? "",
    subId: raw.brtSubid ?? "",
    start: raw.brtSname ?? "",
    end: raw.brtEname ?? "",
    firstBus: formatTime(raw.brtFirsttime),
    lastBus: formatTime(raw.brtLasttime),
    interval:
      raw.brtMininterval && raw.brtMaxinterval
        ? `${raw.brtMininterval}~${raw.brtMaxinterval}분`
        : "정보 없음",
    distance: raw.brtLength ? `${(Number(raw.brtLength) / 1000).toFixed(1)}km` : "-",
  };
}

function mapToBusStop(raw: RawRouteField, index: number): BusStop {
  return {
    id: raw.stopStandardid || raw.stopId || String(index),
    name: raw.stopKname ?? "",
    order: Number(raw.brnSeqno) || index + 1,
  };
}

// 이미 조회한 데이터는 다시 API를 호출하지 않도록 메모리에 캐싱합니다.
let routesCache: Route[] | null = null;
let routesPromise: Promise<Route[]> | null = null;
const stopsCache = new Map<string, BusStop[]>();

export async function fetchAllRoutes(): Promise<Route[]> {
  if (routesCache) return routesCache;
  if (!routesPromise) {
    routesPromise = fetchRoutesRaw()
      .then((raw) => {
        const routes = raw.filter((r) => r.brtStdid).map(mapToRoute);
        routesCache = routes;
        return routes;
      })
      .catch((err) => {
        routesPromise = null; // 실패하면 다음 시도에서 다시 호출되도록 캐시를 비웁니다
        throw err;
      });
  }
  return routesPromise;
}

export async function fetchStopsForRoute(routeId: string): Promise<BusStop[]> {
  const cached = stopsCache.get(routeId);
  if (cached) return cached;

  const raw = await fetchStopsRaw(routeId);
  const stops = raw
    .filter((s) => s.stopStandardid || s.stopId)
    .map(mapToBusStop)
    .sort((a, b) => a.order - b.order);

  stopsCache.set(routeId, stops);
  return stops;
}

/** 테스트/새로고침용: 캐시를 비워서 다음 호출이 API를 다시 부르게 합니다. */
export function clearRouteCache() {
  routesCache = null;
  routesPromise = null;
  stopsCache.clear();
}
