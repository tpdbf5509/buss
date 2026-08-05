export interface Region {
  sido: string;
  sigungus: string[];
}

export interface Station {
  id: string;
  name: string;
  arsId: string;
  lat: number;
  lng: number;
  distance: number;
  direction: string;
}

export interface Arrival {
  routeId: string;
  routeName: string;
  routeType: RouteType;
  predictTime: number;
  vehicleId: string;
  lowFloor: boolean;
  congestion: Congestion;
  remainSeats: number;
}

export type RouteType = "일반" | "좌석" | "마을버스" | "직행" | "광역";

export type Congestion = "여유" | "보통" | "혼잡" | "매우혼잡";

export interface BusRoute {
  id: string;
  routeName: string;
  routeType: RouteType;
  startStop: string;
  endStop: string;
  firstBus: string;
  lastBus: string;
  interval: number;
  company: string;
}

export interface RouteStation {
  seq: number;
  stationName: string;
  arsId: string;
  arrival?: Arrival;
}

export interface Favorite {
  id: string;
  type: "station" | "route";
  name: string;
  label: string;
  refId: string;
}

export interface CardInfo {
  balance: number;
  cardName: string;
  cardNumber: string;
  monthlyUsage: number;
  weeklyUsage: number;
  history: CardHistory[];
}

export interface CardHistory {
  id: string;
  date: string;
  routeName: string;
  fromStation: string;
  amount: number;
  type: "ride" | "charge";
}

export interface AlertSetting {
  id: string;
  routeName: string;
  stationName: string;
  targetStation: string;
  minutesBefore: number;
  stopsBefore: number;
  sound: boolean;
  vibrate: boolean;
  active: boolean;
}

export interface AlertRecord {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "dropoff" | "arrival" | "system";
}
