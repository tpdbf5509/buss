import { useState } from "react";
import { MapPin, ChevronDown, Star, Clock, RadioTower } from "lucide-react";
import { useApp } from "@/store/AppContext";
import { useAsync } from "@/hooks/useAsync";
import { fetchAllRoutes } from "@/services/routeService";
import { RegionModal } from "@/components/RegionModal";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/ui";
import { showToast } from "@/components/Toast";
import type { TabId } from "@/components/BottomNav";

export function HomeScreen({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { state, dispatch } = useApp();
  const [regionOpen, setRegionOpen] = useState(false);

  const { data: routes, status, retry } = useAsync(() => fetchAllRoutes(), []);
  const preview = routes?.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-b from-blue-600 to-blue-500 text-white px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold tracking-tight">BUS STOP</h1>
          <button
            onClick={() => setRegionOpen(true)}
            className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium hover:bg-white/25 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>{state.region.sigungu}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-blue-100 text-sm">전주시 버스 노선 정보</p>
      </header>

      {/* 실시간 도착정보 준비중 안내 */}
      <section className="px-4 -mt-3">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <RadioTower className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">실시간 도착정보는 준비중이에요</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              현재 연동된 API는 노선·정류장·배차시간 정보만 제공합니다. 실시간 위치와 도착예정시간은
              추가 연동 후 제공될 예정이에요.
            </p>
          </div>
        </div>
      </section>

      {/* 노선 둘러보기 */}
      <section className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">노선 둘러보기</h3>
          <button
            onClick={() => onNavigate("bus")}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            전체 노선 검색
          </button>
        </div>

        {status === "loading" && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <LoadingSkeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}
        {status === "error" && <ErrorState onRetry={retry} />}
        {status === "success" && preview && preview.length === 0 && (
          <EmptyState title="불러올 수 있는 노선이 없어요" />
        )}
        {status === "success" && preview && preview.length > 0 && (
          <div className="space-y-2">
            {preview.map((route) => (
              <button
                key={`${route.id}-${route.subId}`}
                onClick={() => onNavigate("bus")}
                className="w-full bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-blue-700 font-bold text-sm">{route.number}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">{route.number}번</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-600">{route.start || "기점 정보 없음"}</span>
                        <span className="text-slate-300">↔</span>
                        <span className="font-medium text-slate-600">{route.end || "종점 정보 없음"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    첫차 {route.firstBus}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Favorites */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">즐겨찾기</h3>
          <button
            onClick={() => onNavigate("my")}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            전체보기
          </button>
        </div>
        {state.favorites.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-100">
            <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">즐겨찾기를 추가해 보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {state.favorites.map((fav) => (
              <button
                key={fav.id}
                onClick={() => onNavigate(fav.type === "route" ? "bus" : "home")}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 text-left hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  </div>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    {fav.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">{fav.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {fav.type === "station" ? "정류장" : "노선"}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      <RegionModal
        open={regionOpen}
        onClose={() => setRegionOpen(false)}
        onSelect={(sido, sigungu) => {
          dispatch({ type: "SET_REGION", sido, sigungu });
          setRegionOpen(false);
          showToast(`${sido} ${sigungu}로 설정되었어요`);
        }}
      />
    </div>
  );
}
