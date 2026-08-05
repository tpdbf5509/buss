import { useState, useEffect } from "react";
import { Bell, Plus, Volume2, Vibrate, Clock, MapPin, Trash2, Bell as BellIcon } from "lucide-react";
import { useApp } from "@/store/AppContext";
import { ALERT_RECORDS } from "@/data/mock";
import { Toggle, EmptyState } from "@/components/ui";
import { showToast } from "@/components/Toast";
import type { AlertSetting } from "@/types";

export function AlertScreen() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [records, setRecords] = useState(ALERT_RECORDS);

  const markAllRead = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, read: true })));
    showToast("모든 알림을 읽었어요");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white px-5 pt-12 pb-4 border-b border-slate-100 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">알림</h1>
            <p className="text-xs text-slate-400 mt-0.5">하차 알림 · 알림 센터</p>
          </div>
          <button
            onClick={markAllRead}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            모두 읽음
          </button>
        </div>
      </header>

      {/* Drop-off alarm settings */}
      <section className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-700">하차 알림 설정</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        </div>

        {state.alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">설정된 하차 알림이 없어요</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-3 text-sm text-blue-600 font-medium hover:underline"
            >
              알림 설정하기
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {state.alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onToggle={() => dispatch({ type: "TOGGLE_ALERT", id: alert.id })}
                onRemove={() => {
                  dispatch({ type: "REMOVE_ALERT", id: alert.id });
                  showToast("알림을 삭제했어요");
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Notification center */}
      <section className="px-4 mt-6">
        <h2 className="text-sm font-bold text-slate-700 mb-3">알림 센터</h2>
        {records.length === 0 ? (
          <EmptyState icon={BellIcon} title="알림이 없어요" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {records.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-start gap-3 px-4 py-3.5 ${
                  i !== records.length - 1 ? "border-b border-slate-50" : ""
                } ${!r.read ? "bg-blue-50/40" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    r.type === "dropoff"
                      ? "bg-blue-50"
                      : r.type === "arrival"
                      ? "bg-emerald-50"
                      : "bg-amber-50"
                  }`}
                >
                  <Bell
                    className={`w-4 h-4 ${
                      r.type === "dropoff"
                        ? "text-blue-600"
                        : r.type === "arrival"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{r.title}</p>
                    {!r.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.body}</p>
                  <p className="text-[11px] text-slate-300 mt-1">{r.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showAdd && (
        <AddAlertModal
          onClose={() => setShowAdd(false)}
          onAdd={(alert) => {
            dispatch({ type: "ADD_ALERT", alert });
            setShowAdd(false);
            showToast("하차 알림을 설정했어요");
          }}
        />
      )}
    </div>
  );
}

function AlertCard({
  alert,
  onToggle,
  onRemove,
}: {
  alert: AlertSetting;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900">{alert.routeName}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                alert.active ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
              }`}
            >
              {alert.active ? "활성" : "꺼짐"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {alert.stationName}
            </span>
            <span className="text-slate-300">→</span>
            <span className="flex items-center gap-1 font-medium text-slate-600">
              {alert.targetStation}
            </span>
          </div>
        </div>
        <Toggle checked={alert.active} onChange={onToggle} />
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          {alert.minutesBefore}분 전
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-blue-500" />
          {alert.stopsBefore}정거장 전
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {alert.sound && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Volume2 className="w-3.5 h-3.5" />
            </span>
          )}
          {alert.vibrate && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Vibrate className="w-3.5 h-3.5" />
            </span>
          )}
          <button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors ml-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddAlertModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (alert: AlertSetting) => void;
}) {
  const [routeName, setRouteName] = useState("100번");
  const [stationName, setStationName] = useState("전주역앞");
  const [targetStation, setTargetStation] = useState("시청");
  const [minutesBefore, setMinutesBefore] = useState(3);
  const [stopsBefore, setStopsBefore] = useState(2);
  const [sound, setSound] = useState(true);
  const [vibrate, setVibrate] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">하차 알림 설정</h2>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">노선</label>
            <input
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">탑승 정류장</label>
            <input
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">하차 정류장</label>
            <input
              value={targetStation}
              onChange={(e) => setTargetStation(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">n분 전 알림</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMinutesBefore((m) => Math.max(1, m - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"
                >
                  -
                </button>
                <span className="flex-1 text-center font-bold text-slate-900">{minutesBefore}분</span>
                <button
                  onClick={() => setMinutesBefore((m) => m + 1)}
                  className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">n정거장 전</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStopsBefore((s) => Math.max(1, s - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"
                >
                  -
                </button>
                <span className="flex-1 text-center font-bold text-slate-900">{stopsBefore}정거장</span>
                <button
                  onClick={() => setStopsBefore((s) => s + 1)}
                  className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <Volume2 className="w-4 h-4 text-slate-400" />
                소리 알림
              </span>
              <Toggle checked={sound} onChange={setSound} />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <Vibrate className="w-4 h-4 text-slate-400" />
                진동 알림
              </span>
              <Toggle checked={vibrate} onChange={setVibrate} />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 sticky bottom-0 bg-white flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-medium text-sm hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() =>
              onAdd({
                id: Date.now().toString(),
                routeName,
                stationName,
                targetStation,
                minutesBefore,
                stopsBefore,
                sound,
                vibrate,
                active: true,
              })
            }
            className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            설정
          </button>
        </div>
      </div>
    </div>
  );
}
