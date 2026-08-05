import { parseXml } from "./xml";

const BASE_URL = "https://apis.data.go.kr/4641000/nosun";
const SERVICE_KEY = import.meta.env.VITE_JEONJU_API_KEY as string | undefined;

export type RawRouteField = Record<string, string>;

interface ApiEnvelope {
  RFC30?: {
    code?: string;
    msg?: string;
    routeList?: { list?: RawRouteField[] };
  };
}

async function callApi(path: string, params: Record<string, string> = {}): Promise<RawRouteField[]> {
  if (!SERVICE_KEY) {
    throw new Error(
      "VITE_JEONJU_API_KEY가 설정되지 않았습니다. 프로젝트 루트에 .env 파일을 만들고 키를 넣어주세요."
    );
  }

  const search = new URLSearchParams(params);
  const url = `${BASE_URL}${path}?serviceKey=${SERVICE_KEY}${
    search.toString() ? `&${search.toString()}` : ""
  }`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    // 브라우저에서 공공데이터포털 API로 직접 호출 시 CORS로 막힐 수 있음
    throw new Error(
      "노선 정보 서버에 연결하지 못했습니다. (네트워크 또는 CORS 문제일 수 있습니다)"
    );
  }

  if (!res.ok) {
    throw new Error(`노선 정보를 불러오지 못했습니다. (HTTP ${res.status})`);
  }

  const xmlText = await res.text();
  const json = parseXml<ApiEnvelope>(xmlText);
  const body = json.RFC30;
  if (!body) {
    throw new Error("노선 정보를 불러오지 못했습니다. (응답 형식 오류)");
  }
  if (body.code && body.code !== "000") {
    throw new Error(body.msg || `노선 정보를 불러오지 못했습니다. (코드 ${body.code})`);
  }

  return body.routeList?.list ?? [];
}

/** 오퍼레이션 1: 전체 (노선번호, class) 조합 목록 (파라미터 없음) */
async function getRouteIdList(): Promise<RawRouteField[]> {
  return callApi("/bus_location_all_common");
}

/** 오퍼레이션 2: 특정 노선번호의 지선(브랜치) 상세 목록 */
async function getRouteDetail(brtId: string, brtClass: string): Promise<RawRouteField[]> {
  return callApi("/bus_location1_common", { brtId, brtClass });
}

// 동시에 너무 많은 요청을 보내면 일일 호출한도를 빨리 소진하거나
// 서버에서 차단할 수 있어, 동시 실행 개수를 제한합니다.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const current = cursor++;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * 전체 노선 목록. 오퍼레이션 1로 (노선번호, class) 조합을 받아온 뒤,
 * 각 조합마다 오퍼레이션 2를 호출해 실제 지선 상세 데이터를 펼쳐서 반환합니다.
 */
export async function getRoutes(): Promise<RawRouteField[]> {
  const idList = await getRouteIdList();

  const uniquePairs = Array.from(
    new Map(idList.filter((r) => r.brtId).map((r) => [`${r.brtId}-${r.brtClass}`, r])).values()
  );

  const branchLists = await mapWithConcurrency(uniquePairs, 6, (pair) =>
    getRouteDetail(pair.brtId, pair.brtClass).catch(() => [] as RawRouteField[])
  );

  return branchLists.flat();
}

/** 오퍼레이션 3: 노선(지선)별 경유 정류장 목록 */
export async function getRouteStops(routeId: string): Promise<RawRouteField[]> {
  return callApi("/bus_location_busstop_list_common", { brtStdid: routeId });
}
