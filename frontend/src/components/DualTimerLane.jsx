import React, { useState, useEffect, useRef } from 'react';
import { formatTimeMs } from '../utils/ranking';

export default function DualTimerLane({
  laneKey = 'A',
  laneLabel = 'Lajur A',
  accentColor = 'bg-blue-500',
  isFrozen = false,
  matchStatus,
  syncedTimer = null,
  serverClockOffset = 0,
  onSyncTimer,
  nextSuggestedId = 'TIM-005',
  onSaveParticipant,
  onShowToast,
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState('pertandingan'); // 'pertandingan' | 'persiapan'

  const [participantId, setParticipantId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [completedMissions, setCompletedMissions] = useState(1);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);
  const lastLocalActionRef = useRef(0);
  const editingFieldRef = useRef(null);
  const metaDebounceRef = useRef(null);

  const startLocalTicker = (baseElapsed, startedAtServerMs) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const localStart = startedAtServerMs - serverClockOffset - baseElapsed;
    startTimeRef.current = localStart;
    setElapsedMs(Math.max(0, Date.now() - localStart));
    intervalRef.current = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - startTimeRef.current));
    }, 10);
  };

  // Sinkronkan state timer dari server (saat HP/Laptop lain menekan Start/Jeda/Reset)
  useEffect(() => {
    if (!syncedTimer) return;
    // Abaikan hasil poll lama sesaat setelah aksi lokal (hindari flicker)
    if (Date.now() - lastLocalActionRef.current < 700) return;

    if (syncedTimer.isRunning) {
      setIsRunning(true);
      setIsPaused(false);
      startLocalTicker(syncedTimer.elapsedMs || 0, syncedTimer.startedAtMs || Date.now());
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
      const serverElapsed = syncedTimer.elapsedMs || 0;
      setElapsedMs(serverElapsed);
      setIsPaused(serverElapsed > 0);
    }

    if (syncedTimer.mode && syncedTimer.mode !== mode) {
      setMode(syncedTimer.mode);
    }
    if (editingFieldRef.current !== 'participantId' && syncedTimer.participantId !== undefined) {
      setParticipantId(syncedTimer.participantId || '');
    }
    if (editingFieldRef.current !== 'teamName' && syncedTimer.teamName !== undefined) {
      setTeamName(syncedTimer.teamName || '');
    }
    if (
      editingFieldRef.current !== 'completedMissions' &&
      syncedTimer.completedMissions !== undefined &&
      syncedTimer.completedMissions !== null
    ) {
      setCompletedMissions(syncedTimer.completedMissions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedTimer, serverClockOffset]);

  // Hentikan timer otomatis apabila pertandingan diselesaikan atau dijeda global
  useEffect(() => {
    if ((isFrozen || matchStatus === 'jeda') && isRunning) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
      setIsPaused(true);
    }
  }, [isFrozen, matchStatus, isRunning]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (metaDebounceRef.current) clearTimeout(metaDebounceRef.current);
    };
  }, []);

  const syncMetaToServer = (nextMeta, immediate = false) => {
    if (!onSyncTimer) return;
    if (metaDebounceRef.current) clearTimeout(metaDebounceRef.current);
    const run = () => {
      lastLocalActionRef.current = Date.now();
      onSyncTimer(laneKey, 'update_meta', nextMeta);
    };
    if (immediate) {
      run();
    } else {
      metaDebounceRef.current = setTimeout(run, 400);
    }
  };

  const handleStart = () => {
    if (isFrozen) {
      onShowToast('🔒 Pertandingan telah Selesai. Skor & Timer telah dikunci!');
      return;
    }
    if (!isRunning) {
      lastLocalActionRef.current = Date.now();
      startTimeRef.current = Date.now() - elapsedMs;
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 10);
      setIsRunning(true);
      setIsPaused(false);
      if (onSyncTimer) onSyncTimer(laneKey, 'start');
    }
  };

  const handlePause = () => {
    if (isRunning) {
      lastLocalActionRef.current = Date.now();
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
      setIsPaused(true);
      if (onSyncTimer) onSyncTimer(laneKey, 'pause');
    }
  };

  const handleReset = () => {
    lastLocalActionRef.current = Date.now();
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setElapsedMs(0);
    if (onSyncTimer) onSyncTimer(laneKey, 'reset');
  };

  const handleClearInputs = () => {
    setParticipantId('');
    setTeamName('');
    setCompletedMissions(1);
    syncMetaToServer({ mode, participantId: '', teamName: '', completedMissions: 1 }, true);
  };

  const handleSave = () => {
    if (isFrozen) {
      onShowToast('🔒 Pertandingan berstatus Selesai. Penambahan skor dinonaktifkan!');
      return;
    }

    const trimmedTeam = teamName.trim();
    if (!trimmedTeam) {
      onShowToast(`⚠️ Nama tim pada ${laneLabel} masih kosong!`);
      return;
    }

    if (mode === 'persiapan') {
      onShowToast(`⚙️ Waktu Persiapan ${trimmedTeam} selesai. Tidak masuk peringkat.`);
      lastLocalActionRef.current = Date.now();
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
      setIsPaused(false);
      setElapsedMs(0);
      setParticipantId('');
      setTeamName('');
      setCompletedMissions(1);
      if (onSyncTimer) onSyncTimer(laneKey, 'clear_after_save');
      return;
    }

    if (elapsedMs === 0) {
      onShowToast(`⚠️ Timer ${laneLabel} belum dijalankan!`);
      return;
    }

    // Hentikan timer jika masih berjalan saat disimpan
    if (isRunning) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
    }

    const finalId = participantId.trim() || nextSuggestedId;

    onSaveParticipant({
      participantId: finalId,
      team: trimmedTeam,
      completedMissions: Number.isFinite(Number(completedMissions)) ? Number(completedMissions) : 0,
      timeMs: elapsedMs,
      timeStr: formatTimeMs(elapsedMs),
      customStatus: 'Otomatis',
    });

    lastLocalActionRef.current = Date.now();
    setIsPaused(false);
    setElapsedMs(0);
    setParticipantId('');
    setTeamName('');
    setCompletedMissions(1);
    if (onSyncTimer) onSyncTimer(laneKey, 'clear_after_save');
  };

  const dotClass = isRunning
    ? 'w-3 h-3 rounded-full bg-emerald-500 animate-pulse'
    : isPaused
    ? 'w-3 h-3 rounded-full bg-amber-500'
    : 'w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600';

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-lg border p-6 flex flex-col gap-4 relative overflow-hidden transition-all ${
        isFrozen
          ? 'border-rose-200 dark:border-rose-900/60 opacity-90'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className={`absolute top-0 left-0 w-full h-1 ${accentColor}`}></div>

      {/* Header Lajur */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {laneLabel}
          </span>
          {isFrozen && (
            <span className="text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded-full flex items-center gap-1">
              <i className="fa-solid fa-lock text-[10px]"></i> Freeze Data
            </span>
          )}
        </div>
        <span className={dotClass}></span>
      </div>

      {/* Digital Display */}
      <div className="bg-slate-950 rounded-xl h-36 flex flex-col items-center justify-center shadow-inner relative border-4 border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 rounded-lg pointer-events-none"></div>
        <div className="font-digital text-4xl sm:text-5xl md:text-6xl text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] tracking-wider">
          {formatTimeMs(elapsedMs)}
        </div>
        <span className="text-[11px] text-slate-400 font-mono mt-1 uppercase tracking-widest">
          {mode === 'pertandingan' ? 'Mode Kompetisi Resmi' : 'Mode Uji Coba / Persiapan'}
        </span>
      </div>

      {/* Timer Controls */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleStart}
          disabled={isFrozen}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <i className="fa-solid fa-play"></i> Start
        </button>
        <button
          onClick={handlePause}
          disabled={isFrozen || !isRunning}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <i className="fa-solid fa-pause"></i> Jeda
        </button>
        <button
          onClick={handleReset}
          disabled={isFrozen}
          className="bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <i className="fa-solid fa-rotate-left"></i> Reset
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-transparent dark:border-slate-700">
        <button
          type="button"
          onClick={() => {
            setMode('pertandingan');
            syncMetaToServer({ mode: 'pertandingan', participantId, teamName, completedMissions }, true);
          }}
          className={
            mode === 'pertandingan'
              ? 'flex-1 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm py-2 rounded-lg font-bold text-sm transition-all'
              : 'flex-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-2 rounded-lg font-semibold text-sm transition-all'
          }
        >
          🏆 Pertandingan
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('persiapan');
            syncMetaToServer({ mode: 'persiapan', participantId, teamName, completedMissions }, true);
          }}
          className={
            mode === 'persiapan'
              ? 'flex-1 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm py-2 rounded-lg font-bold text-sm transition-all'
              : 'flex-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-2 rounded-lg font-semibold text-sm transition-all'
          }
        >
          ⚙️ Persiapan
        </button>
      </div>

      {/* Input Skor & Identitas Peserta (Sesuai PRD 5.2 & 5.3) */}
      <div className="flex flex-col gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              ID Peserta
            </label>
            <input
              type="text"
              disabled={isFrozen}
              value={participantId}
              onFocus={() => { editingFieldRef.current = 'participantId'; }}
              onBlur={() => {
                editingFieldRef.current = null;
                syncMetaToServer({ mode, participantId, teamName, completedMissions }, true);
              }}
              onChange={(e) => {
                const val = e.target.value;
                setParticipantId(val);
                syncMetaToServer({ mode, participantId: val, teamName, completedMissions });
              }}
              placeholder={nextSuggestedId}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Nama Peserta / Tim
            </label>
            <input
              type="text"
              disabled={isFrozen}
              value={teamName}
              onFocus={() => { editingFieldRef.current = 'teamName'; }}
              onBlur={() => {
                editingFieldRef.current = null;
                syncMetaToServer({ mode, participantId, teamName, completedMissions }, true);
              }}
              onChange={(e) => {
                const val = e.target.value;
                setTeamName(val);
                syncMetaToServer({ mode, participantId, teamName: val, completedMissions });
              }}
              placeholder={`Nama Kelompok ${laneLabel.slice(-1)}...`}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
            />
          </div>
        </div>

        {/* Dropdown Jumlah Misi yang Diselesaikan */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
            Jumlah Misi yang Diselesaikan
          </label>
          <select
            disabled={isFrozen}
            value={completedMissions}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCompletedMissions(val);
              syncMetaToServer({ mode, participantId, teamName, completedMissions: val }, true);
            }}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
          >
            {[0, 1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        {/* Tombol Aksi Simpan & Reset Input */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isFrozen}
            onClick={handleSave}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            title="Simpan Waktu ke Leaderboard"
          >
            <i className="fa-solid fa-check"></i> Simpan Waktu
          </button>
          <button
            type="button"
            disabled={isFrozen}
            onClick={handleClearInputs}
            className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 text-slate-600 dark:text-slate-300 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
            title="Bersihkan Input"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
