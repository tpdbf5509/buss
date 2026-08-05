import { XMLParser } from "fast-xml-parser";

// 전주시 노선정보 API는 XML만 지원합니다. 응답이 항상
// <RFC30><code/><msg/><routeList><list>...</list></routeList></RFC30> 구조라
// list가 1개일 때도 배열로 나오도록 강제합니다.
const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false, // "0501" 같은 값이 숫자로 잘못 변환되는 걸 방지
  trimValues: true,
  isArray: (tagName) => tagName === "list",
});

export function parseXml<T = unknown>(xml: string): T {
  return parser.parse(xml) as T;
}
