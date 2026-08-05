export interface Route {
  id: string; // brtStdid - 노선(지선) 식별ID, 정류장 조회 시 이 값을 사용
  number: string; // brtId - 사용자가 보는 버스 번호 (예: "79")
  class: string; // brtClass - 계통 구분값
  subId: string; // brtSubid - 지선 구분값 (0, A, B...)
  start: string; // brtSname - 기점
  end: string; // brtEname - 종점
  firstBus: string; // "06:07" 형태로 변환된 첫차 시각
  lastBus: string; // 막차 시각
  interval: string; // 배차간격 (문자열, 정보 없으면 "정보 없음")
  distance: string; // 노선 길이 (km 문자열)
}

export interface BusStop {
  id: string;
  name: string;
  order: number;
}
