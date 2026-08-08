import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";
import type { Favorite, AlertSetting } from "@/types";
import { FAVORITES, ALERT_SETTINGS, CARD_INFO } from "@/data/mock";

interface AppState {
  region: { sido: string; sigungu: string };
  favorites: Favorite[];
  cardBalance: number;
  alerts: AlertSetting[];
}

type Action =
  | { type: "SET_REGION"; sido: string; sigungu: string }
  | { type: "ADD_FAVORITE"; favorite: Favorite }
  | { type: "REMOVE_FAVORITE"; id: string }
  | { type: "RENAME_FAVORITE"; id: string; label: string }
  | { type: "CHARGE_CARD"; amount: number }
  | { type: "PAY_CARD"; amount: number }
  | { type: "ADD_ALERT"; alert: AlertSetting }
  | { type: "TOGGLE_ALERT"; id: string }
  | { type: "REMOVE_ALERT"; id: string };

const FAVORITES_STORAGE_KEY = "busssss_favorites_v1";

function loadFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return FAVORITES;
}

const initialState: AppState = {
  region: { sido: "전북특별자치도", sigungu: "전주시" },
  favorites: loadFavorites(),
  cardBalance: CARD_INFO.balance,
  alerts: ALERT_SETTINGS,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_REGION":
      return { ...state, region: { sido: action.sido, sigungu: action.sigungu } };
    case "ADD_FAVORITE":
      // 이미 같은 refId로 등록된 즐겨찾기가 있으면 중복 추가하지 않음
      if (state.favorites.some((f) => f.refId === action.favorite.refId)) return state;
      return { ...state, favorites: [...state.favorites, action.favorite] };
    case "REMOVE_FAVORITE":
      return { ...state, favorites: state.favorites.filter((f) => f.id !== action.id) };
    case "RENAME_FAVORITE":
      return {
        ...state,
        favorites: state.favorites.map((f) =>
          f.id === action.id ? { ...f, label: action.label } : f
        ),
      };
    case "CHARGE_CARD":
      return { ...state, cardBalance: state.cardBalance + action.amount };
    case "PAY_CARD":
      return { ...state, cardBalance: Math.max(0, state.cardBalance - action.amount) };
    case "ADD_ALERT":
      return { ...state, alerts: [...state.alerts, action.alert] };
    case "TOGGLE_ALERT":
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.id ? { ...a, active: !a.active } : a
        ),
      };
    case "REMOVE_ALERT":
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.id) };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 즐겨찾기가 바뀔 때마다 localStorage에 저장 -> 새로고침해도 유지됨
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(state.favorites));
    } catch {}
  }, [state.favorites]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}