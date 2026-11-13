import React, { useState, useEffect, useRef } from 'react';
import { formatTimeMs } from '../utils/ranking';

export default function DualTimerLane({
  laneLabel = 'Lajur A',
  accentColor = 'bg-blue-500',
  isFrozen = false,
  matchStatus,
  nextSuggestedId = 'TIM-005',
  onSaveParticipant,
  onShowToast,
  onPlayBeep,
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState('pertandingan'); // 'pertandingan' | 'persiapan'

  const [participantId, setParticipantId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [round1Score, setRound1Score] = useState(80);
  const [round2Score, setRound2Score] = useState(15);
  const [customStatus, setCustomStatus] = useState('Otomatis');

  const intervalRef = useRef(null);
  const startTimeRef = useRef(0);

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
    };
  }, []);

  const handleStart = () => {
    if (isFrozen) {
      onShowToast('🔒 Pertandingan telah Selesai. Skor & Timer telah dikunci!');
      return;
    }
    if (!isRunning) {
      onPlayBeep?.(660, 0.08);
      startTimeRef.current = Date.now() - elapsedMs;
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 10);
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    if (isRunning) {
      onPlayBeep?.(440, 0.08);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
      setIsPaused(true);
    }
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setElapsedMs(0);
  };

  const handleClearInputs = () => {
    setParticipantId('');
    setTeamName('');
    setRound1Score(80);
    setRound2Score(15);
    setCustomStatus('Otomatis');
  };

  const computedTotalScore = (Number(round1Score) || 0) + (Number(round2Score) || 0);

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
      handleReset();
      handleClearInputs();
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
      round1Score: Number(round1Score) || 0,
      round2Score: Number(round2Score) || 0,
      totalScore: computedTotalScore,
      timeMs: elapsedMs,
      timeStr: formatTimeMs(elapsedMs),
      customStatus,
    });

    onPlayBeep?.(880, 0.12);
    handleReset();
    handleClearInputs();
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
          onClick={() => setMode('pertandingan')}
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
          onClick={() => setMode('persiapan')}
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
              onChange={(e) => setParticipantId(e.target.value)}
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
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={`Nama Kelompok ${laneLabel.slice(-1)}...`}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
            />
          </div>
        </div>

        {/* Input Poin Ronde/Sesi & Total Skor */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Skor Sesi 1
            </label>
            <input
              type="number"
              disabled={isFrozen}
              value={round1Score}
              onChange={(e) => setRound1Score(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Skor Sesi 2
            </label>
            <input
              type="number"
              disabled={isFrozen}
              value={round2Score}
              onChange={(e) => setRound2Score(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800/40"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">
              Total Skor
            </label>
            <div className="w-full px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm font-extrabold text-indigo-700 dark:text-indigo-300 text-center">
              {computedTotalScore}
            </div>
          </div>
        </div>

        {/* Tombol Aksi Simpan & Reset Input */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isFrozen}
            onClick={handleSave}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            title="Simpan Skor & Waktu ke Leaderboard"
          >
            <i className="fa-solid fa-check"></i> Simpan Skor &amp; Waktu
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
