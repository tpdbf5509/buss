import { getRouteNoList, getRouteAcctoBusLcList, type RawTagoField } from "@/api/tago";
import type { Route, RouteDirection, BusLocation } from "@/types/route";

// 노선번호(표시용, 예: "385", "3-1") 기준으로 TAGO routeId 방향 목록을 캐싱합니다.
const directionsCache = new Map<string, RouteDirection[]>();
// 동시에 같은 요청이 여러 번 나가는 것(리액트 재렌더링/StrictMode 등)을 막기 위한 진행중 캐시
const directionsPromiseCache = new Map<string, Promise<RouteDirection[]>>();

function toDirections(items: RawTagoField[]): RouteDirection[] {
  return items
    .filter((item) => item.routeid)
    .map((item) => ({
      routeId: item.routeid,
      start: item.startnodenm ?? "",
      end: item.endnodenm ?? "",
    }));
}

function normalize(s: string): string {
  return (s ?? "").replace(/\s+/g, "").trim();
}

/** 노선번호가 같은 다른 노선까지 섞여 나오는 걸 막기 위해 기점/종점이 실제로 맞는 것만 남깁니다. */
function filterMatchingDirections(route: Route, directions: RouteDirection[]): RouteDirection[] {
  const rs = normalize(route.start);
  const re = normalize(route.end);

  const matched = directions.filter((d) => {
    const ds = normalize(d.start);
    const de = normalize(d.end);
    return (rs && (ds.includes(rs) || rs.includes(ds))) || (re && (de.includes(re) || re.includes(de)));
  });

  // 매칭되는 게 하나도 없으면(이름 표기가 달라서) 과도한 요청을 막기 위해 최대 2개까지만 사용
  return matched.length > 0 ? matched : directions.slice(0, 2);
}

/**
 * 우리 앱의 Route(전주시 자체 API 기준)를 TAGO routeId로 변환합니다.
 * 표시번호 → 기본번호 순서로 재시도하고, 기점/종점이 일치하는 방향만 남깁니다.
 */
export async function resolveDirections(route: Route): Promise<RouteDirection[]> {
  const cacheKey = route.id || `${route.number}-${route.start}-${route.end}`;

  const cached = directionsCache.get(cacheKey);
  if (cached) return cached;

  const pending = directionsPromiseCache.get(cacheKey);
  if (pending) return pending;

  const promise = (async () => {
    let items = await getRouteNoList(route.number);

    if (items.length === 0 && route.rawNumber && route.rawNumber !== route.number) {
      items = await getRouteNoList(route.rawNumber);
    }

    const allDirections = toDirections(items);
    const directions = filterMatchingDirections(route, allDirections);

    directionsCache.set(cacheKey, directions);
    directionsPromiseCache.delete(cacheKey);
    return directions;
  })();

  directionsPromiseCache.set(cacheKey, promise);
  return promise;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 노선에 현재 운행 중인 모든 버스의 실시간 GPS 위치를 조회합니다. */
export async function fetchBusLocations(route: Route): Promise<BusLocation[]> {
  const directions = await resolveDirections(route);

  if (directions.length === 0) {
    throw new Error("TAGO에 등록된 노선 정보를 찾을 수 없어요.");
  }

  const locations: BusLocation[] = [];
  const errors: unknown[] = [];

  // 동시 요청 시 TAGO 위치정보 API가 429(Too Many Requests)를 반환하는 것으로
  // 확인되어, 병렬 대신 순차 호출 + 짧은 간격을 둡니다.
  for (let i = 0; i < directions.length; i++) {
    const dir = directions[i];
    try {
      const items = await getRouteAcctoBusLcList(dir.routeId);
      for (const item of items) {
        locations.push({
          vehicleNo: item.vehicleno ?? "",
          lat: item.gpslati ? Number(item.gpslati) : null,
          lng: item.gpslong ? Number(item.gpslong) : null,
          nodeName: item.nodenm ?? "",
          nodeOrder: Number(item.nodeord) || 0,
          routeId: dir.routeId,
          direction: `${dir.start} → ${dir.end}`,
        });
      }
    } catch (err) {
      errors.push(err);
    }

    if (i < directions.length - 1) {
      await delay(400);
    }
  }

  if (errors.length === directions.length) {
    const first = errors[0];
    throw first instanceof Error ? first : new Error("실시간 위치를 불러오지 못했어요.");
  }

  return locations;
}