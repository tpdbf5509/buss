import { parseXml } from "./xml";

const BASE_URL = "https://apis.data.go.kr/4641000/nosun";
const SERVICE_KEY = (import.meta.env.VITE_JEONJU_API_KEY as string | undefined)?.trim();

export type RawRouteField = Record<string, string>;

interface ApiEnvelope {
  RFC30?: {
    code?: string;
    msg?: string;
    routeList?: { list?: RawRouteField[] };
  };
}

// 공공데이터포털 게이트웨이가 서비스키/파라미터 자체를 문제삼아 반려할 때 내려주는 공통 오류 포맷
interface OpenApiGatewayError {
  OpenAPI_ServiceResponse?: {
    cmmMsgHeader?: {
      errMsg?: string;
      returnAuthMsg?: string;
      returnReasonCode?: string;
    };
  };
}

// data.go.kr 공식 문서 기준 returnReasonCode 매핑
const GATEWAY_REASON_MESSAGES: Record<string, string> = {
  "01": "애플리케이션 오류가 발생했습니다.",
  "02": "데이터베이스 연결 오류가 발생했습니다.",
  "03": "요청하신 데이터가 없습니다.",
  "04": "HTTP 오류가 발생했습니다.",
  "05": "서비스 응답시간이 초과되었습니다.",
  "10": "잘못된 요청 파라미터입니다.",
  "11": "필수 요청 파라미터가 누락되었습니다.",
  "12": "해당 오픈API 서비스가 존재하지 않습니다.",
  "20": "서비스 접근이 거부되었습니다. 공공데이터포털에서 해당 API 활용신청이 '승인' 상태인지 확인해주세요.",
  "21": "일시적으로 사용이 중지된 서비스키입니다.",
  "22": "일일 요청 한도(트래픽)를 초과했습니다.",
  "30": "등록되지 않은 서비스키입니다. .env의 VITE_JEONJU_API_KEY 값이 정확한지, 그리고 키 발급 후 활성화까지 다소 시간이 걸릴 수 있다는 점을 확인해주세요.",
  "31": "기한이 만료된 서비스키입니다.",
  "32": "등록되지 않은 IP에서의 요청입니다.",
  "33": "서명되지 않은 호출(SSL 등)입니다.",
  "99": "알 수 없는 오류가 발생했습니다.",
};

/**
 * 서비스키를 안전하게 1회만 URL 인코딩합니다.
 * - '일반 인증키(Encoding)'을 그대로 넣은 경우: 이미 %XX 형태가 포함되어 있으므로
 *   먼저 decode한 뒤 다시 encode해서 이중 인코딩(재인코딩 시 403/등록되지 않은 키 오류의 원인)을 방지합니다.
 * - '일반 인증키(Decoding)'을 넣은 경우(+, /, = 등의 특수문자 포함): 그대로 encode합니다.
 */
function encodeServiceKey(key: string): string {
  let raw = key;
  if (/%[0-9A-Fa-f]{2}/.test(key)) {
    try {
      raw = decodeURIComponent(key);
    } catch {
      raw = key;
    }
  }
  return encodeURIComponent(raw);
}

function describeGatewayError(xmlText: string): string | null {
  try {
    const parsed = parseXml<OpenApiGatewayError>(xmlText);
    const header = parsed.OpenAPI_ServiceResponse?.cmmMsgHeader;
    if (!header) return null;
    const code = header.returnReasonCode;
    const detail = (code && GATEWAY_REASON_MESSAGES[code]) || header.errMsg;
    const authMsg = header.returnAuthMsg;
    if (!detail && !authMsg) return null;
    return `${detail ?? "노선 정보를 불러오지 못했습니다."}${
      authMsg ? ` (${authMsg}${code ? ` / 코드 ${code}` : ""})` : ""
    }`;
  } catch {
    return null;
  }
}

async function callApi(path: string, params: Record<string, string> = {}): Promise<RawRouteField[]> {
  if (!SERVICE_KEY) {
    throw new Error(
      "VITE_JEONJU_API_KEY가 설정되지 않았습니다. 프로젝트 루트에 .env 파일을 만들고 키를 넣어주세요."
    );
  }

  const search = new URLSearchParams(params);
  const url = `${BASE_URL}${path}?serviceKey=${encodeServiceKey(SERVICE_KEY)}${
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
    // 게이트웨이 단계에서 거부된 경우(서비스키 문제 등) HTTP 상태코드와 함께
    // OpenAPI_ServiceResponse 형태의 XML 본문이 내려오므로, 상세 원인을 파싱해서 보여줍니다.
    const text = await res.text().catch(() => "");
    const detail = text ? describeGatewayError(text) : null;
    throw new Error(detail ?? `노선 정보를 불러오지 못했습니다. (HTTP ${res.status})`);
  }

  const xmlText = await res.text();
  const json = parseXml<ApiEnvelope>(xmlText);
  const body = json.RFC30;
  if (!body) {
    // 정상 응답(200)인데도 RFC30 envelope가 아니면, 게이트웨이 오류 포맷일 수 있으니 한 번 더 확인합니다.
    const detail = describeGatewayError(xmlText);
    throw new Error(detail ?? "노선 정보를 불러오지 못했습니다. (응답 형식 오류)");
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
