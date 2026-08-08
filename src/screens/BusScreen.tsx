import { useState, useMemo } from "react";
import { Search, X, Star, ArrowLeft, Bus as BusIcon, RadioTower, Navigation } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useBusLocations } from "@/hooks/useBusLocations";
import { useApp } from "@/store/AppContext";
import { fetchAllRoutes, fetchStopsForRoute } from "@/services/routeService";
import type { Route } from "@/types/route";
import type { Favorite } from "@/types";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui";
import { showToast } from "@/components/Toast";

export function BusScreen() {
  const [query, setQuery] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const { state, dispatch } = useApp();

  const { data: routes, status, retry } = useAsync(() => fetchAllRoutes(), []);

  const filtered = routes?.filter(
    (r) =>
      (r.name ?? "").includes(query) ||
      (r.number ?? "").includes(query) ||
      (r.start ?? "").includes(query) ||
      (r.end ?? "").includes(query)
  );
  const isFavorited = (routeId: string) =>
    state.favorites.some((f) => f.type === "route" && f.refId === routeId);

  const toggleFavorite = (route: Route, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = state.favorites.find(
      (f) => f.type === "route" && f.refId === route.id
    );
    if (existing) {
      dispatch({ type: "REMOVE_FAVORITE", id: existing.id });
      showToast("즐겨찾기에서 삭제했어요");
    } else {
      const favorite: Favorite = {
        id: `fav-route-${route.id}`,
        type: "route",
        name: `${route.number}번`,
        label: route.number,
        refId: route.id,
      };
      dispatch({ type: "ADD_FAVORITE", favorite });
      showToast("즐겨찾기에 추가했어요");
    }
  };

  if (selectedRoute) {
    return <RouteDetail route={selectedRoute} onBack={() => setSelectedRoute(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white px-5 pt-12 pb-4 border-b border-slate-100 sticky top-0 z-30">
        <h1 className="text-xl font-bold text-slate-900 mb-3">버스 노선 검색</h1>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="노선번호 또는 기점·종점명을 입력하세요"
            className="w-full pl-10 pr-10 py-3 bg-slate-100 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        {status === "loading" && (
          <p className="text-[11px] text-slate-400 mt-2">
            전주시 노선 데이터를 불러오는 중이에요. 노선이 많아 시간이 걸릴 수 있어요.
          </p>
        )}
      </header>

      <div className="px-4 py-4">
        {status === "loading" && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}
        {status === "error" && <ErrorState onRetry={retry} />}
        {status === "success" && filtered && filtered.length === 0 && (
          <EmptyState
            icon={BusIcon}
            title="검색 결과가 없어요"
            subtitle="다른 노선번호나 정류장명으로 검색해 보세요"
          />
        )}
        {status === "success" && filtered && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((route) => (
              <div
              key={`${route.id}-${route.number}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedRoute(route)}
              onKeyDown={(e) => e.key === "Enter" && setSelectedRoute(route)}
              className="w-full bg-white rounded-2xl p-4 border border-slate-100 text-left hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="text-blue-700 font-bold text-sm leading-tight text-center">
                      {route.number}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">{route.number}번</span>
                  </div>
                </div>
                <button
                  onClick={(e) => toggleFavorite(route, e)}
                  className="p-1 -m-1 rounded-full hover:bg-amber-50"
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      isFavorited(route.id)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-300 hover:text-amber-400"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-600">{route.start || "기점 정보 없음"}</span>
                <span className="text-slate-300">→</span>
                <span className="font-medium text-slate-600">{route.end || "종점 정보 없음"}</span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                <span>첫차 {route.firstBus}</span>
                <span>막차 {route.lastBus}</span>
                <span>배차 {route.interval}</span>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RouteDetail({ route, onBack }: { route: Route; onBack: () => void }) {
  const { data: stops, status, retry } = useAsync(() => fetchStopsForRoute(route.id), [route.id]);
  const { state, dispatch } = useApp();
  const {
    data: buses,
    status: busStatus,
    error: busError,
    lastUpdated,
    retry: retryBuses,
  } = useBusLocations(route);
  const busesByStop = useMemo(() => {
    const normalize = (s: string) => (s ?? "").replace(/\s+/g, "").replace(/\(.*?\)/g, "").trim();
    const map = new Map<string, typeof buses>();
    if (!buses) return map;
    for (const bus of buses) {
      const key = normalize(bus.nodeName);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(bus);
    }
    return map;
  }, [buses]);
  const normalizeStopName = (s: string) =>
    (s ?? "").replace(/\s+/g, "").replace(/\(.*?\)/g, "").trim();

 
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white px-4 pt-12 pb-4 border-b border-slate-100 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">{route.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {route.start || "기점 정보 없음"} → {route.end || "종점 정보 없음"}
            </p>
          </div>
          <button
            onClick={() => {
              const existing = state.favorites.find(
                (f) => f.type === "route" && f.refId === route.id
              );
              if (existing) {
                dispatch({ type: "REMOVE_FAVORITE", id: existing.id });
                showToast("즐겨찾기에서 삭제했어요");
              } else {
                dispatch({
                  type: "ADD_FAVORITE",
                  favorite: {
                    id: `fav-route-${route.id}`,
                    type: "route",
                    name: `${route.number}번`,
                    label: route.number,
                    refId: route.id,
                  },
                });
                showToast("즐겨찾기에 추가했어요");
              }
            }}
            className="p-2 rounded-full hover:bg-slate-100"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                state.favorites.some((f) => f.type === "route" && f.refId === route.id)
                  ? "text-amber-400 fill-amber-400"
                  : "text-slate-300"
              }`}
            />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
          <span>첫차 {route.firstBus}</span>
          <span>막차 {route.lastBus}</span>
          <span>배차간격 {route.interval}</span>
          <span>{route.distance}</span>
        </div>
      </header>

      <div className="px-4 pt-3 flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            busStatus === "success" && buses && buses.length > 0
              ? "bg-blue-500"
              : busStatus === "error"
              ? "bg-red-400"
              : "bg-slate-300"
          }`}
        />
        <span className="text-[11px] text-slate-400">
          {busStatus === "loading" && "실시간 위치 불러오는 중"}
          {busStatus === "error" && busError}
          {busStatus === "success" && buses && buses.length > 0 && "실시간 위치 연동 중"}
          {busStatus === "success" && buses && buses.length === 0 && "현재 운행 중인 버스가 없어요"}
        </span>
        {lastUpdated && (
          <span className="text-[10px] text-slate-300 ml-auto">
            {lastUpdated.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} 갱신
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        {status === "loading" && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <LoadingSkeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}
        {status === "error" && <ErrorState onRetry={retry} />}
        {status === "success" && stops && stops.length === 0 && (
          <EmptyState title="경유 정류장 정보가 없어요" />
        )}
        {status === "success" && stops && stops.length > 0 && (
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200" />
            <div className="space-y-1">
            {stops.map((stop) => {
                const stopBuses = busesByStop.get(normalizeStopName(stop.name)) ?? [];
                const hasBus = stopBuses.length > 0;

                return (
                  <div key={`${stop.order}-${stop.id}`} className="relative flex items-start gap-3">
                    <div
                      className={`relative z-10 mt-3 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        hasBus ? "bg-blue-500 border-blue-500" : "bg-white border-slate-300"
                      }`}
                    >
                      <span className="sr-only">{stop.order}</span>
                    </div>
                    <div className="flex-1 py-2.5 px-3 rounded-xl hover:bg-white transition-colors">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-medium w-5 shrink-0">
                          {stop.order}
                        </span>
                        <span className="text-sm font-medium text-slate-700">{stop.name}</span>
                        {hasBus && (
                          <span className="flex items-center gap-1 bg-blue-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                            <Navigation className="w-2.5 h-2.5" />
                            {stopBuses[0].vehicleNo || "버스"}
                            {stopBuses.length > 1 && ` +${stopBuses.length - 1}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
              