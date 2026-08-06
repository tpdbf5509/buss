export interface Route {
  id: string;
  number: string;       // 표시용 번호 (예: "3-1", "62", "5-5")
  rawNumber: string;    // API brtId (예: "3")
  class: string;        // API brtClass (예: "1")
  subId: string;
  name: string;         // 노선 이름 (예: 본선2, 본선3-1)
  start: string;
  end: string;
  firstBus: string;
  lastBus: string;
  interval: string;
  distance: string;
}

export interface BusStop {
  id: string;
  name: string;
  order: number;
}