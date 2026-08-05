import { useState } from "react";
import {
  ChevronRight,
  MapPin,
  Star,
  Pencil,
  Trash2,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  Moon,
  Type,
  Eye,
  Volume2,
  Check,
  X,
} from "lucide-react";
import { useApp } from "@/store/AppContext";
import { RegionModal } from "@/components/RegionModal";
import { Toggle } from "@/components/ui";
import { showToast } from "@/components/Toast";

export function MyScreen() {
  const { state, dispatch } = useApp();
  const [regionOpen, setRegionOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const startEdit = (id: string, label: string) => {
    setEditingId(id);
    setEditLabel(label);
  };

  const saveEdit = () => {
    if (editingId) {
      dispatch({ type: "RENAME_FAVORITE", id: editingId, label: editLabel });
      showToast("이름을 변경했어요");
    }
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-gradient-to-b from-blue-600 to-blue-500 px-5 pt-12 pb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
            승
          </div>
          <div>
            <h1 className="text-lg font-bold">승객님</h1>
            <button
              onClick={() => setRegionOpen(true)}
              className="flex items-center gap-1 text-sm text-blue-100 mt-0.5 hover:text-white transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              {state.region.sido} {state.region.sigungu}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Favorites management */}
      <section className="px-4 -mt-3">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-3">
            <Star className="w-4 h-4 text-amber-400" />
            즐겨찾기 관리
          </div>
          <p className="text-xs text-slate-400 mb-3">항목을 눌러 이름을 바꿀 수 있어요</p>

          {state.favorites.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">즐겨찾기가 없어요</p>
          ) : (
            <div className="space-y-2">
              {state.favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  {editingId === fav.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        autoFocus
                        className="flex-1 px-2.5 py-1.5 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={saveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{fav.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {fav.label} · {fav.type === "station" ? "정류장" : "노선"}
                        </p>
                      </div>
                      <button
                        onClick={() => startEdit(fav.id, fav.label)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          dispatch({ type: "REMOVE_FAVORITE", id: fav.id });
                          showToast("삭제했어요");
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Settings list */}
      <section className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <SettingRow icon={Bell} label="알림 설정" onClick={() => showToast("알림 설정")} />
          <SettingRow icon={Moon} label="다크모드" onClick={() => showToast("다크모드는 준비 중이에요")} />
          <SettingRow icon={Type} label="큰 글씨" onClick={() => showToast("큰 글씨 설정")} />
          <SettingRow icon={Eye} label="색약 모드" onClick={() => showToast("색약 모드 설정")} />
          <SettingRow icon={Volume2} label="음성 안내" onClick={() => showToast("음성 안내 설정")} />
          <SettingRow icon={HelpCircle} label="도움말" onClick={() => showToast("도움말")} />
          <SettingRow icon={LogOut} label="로그아웃" danger onClick={() => showToast("로그아웃되었어요")} last />
        </div>
      </section>

      <p className="text-center text-xs text-slate-300 mt-6">BUS STOP v1.0.0</p>

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

function SettingRow({
  icon: Icon,
  label,
  onClick,
  danger,
  last,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${
        !last ? "border-b border-slate-50" : ""
      }`}
    >
      <Icon className={`w-4.5 h-4.5 ${danger ? "text-red-500" : "text-slate-500"}`} />
      <span className={`flex-1 text-left text-sm font-medium ${danger ? "text-red-500" : "text-slate-700"}`}>
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </button>
  );
}
