import React, { useState } from 'react';
import { calculateLeaderboard } from '../utils/ranking';

export default function SpectatorView({
  activeTab,
  participants,
  matchStatus,
  eventConfig,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState('table'); // 'table' | 'card'

  const rankedData = calculateLeaderboard(participants);
  const filteredData = rankedData.filter(
    (item) =>
      item.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.participantId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const boardTitle = activeTab === 'lb1' ? 'LEADERBOARD 1' : 'LEADERBOARD 2';

  const getStatusBadge = (status) => {
    if (status === 'Pemenang') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
          <i className="fa-solid fa-crown text-amber-500"></i> Pemenang
        </span>
      );
    }
    if (status === 'Lolos') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <i className="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400"></i> Lolos
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <i className="fa-solid fa-circle-xmark text-rose-500 dark:text-rose-400"></i> Gugur
      </span>
    );
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return {
        badge: 'bg-yellow-400 text-yellow-900 shadow-md ring-2 ring-yellow-300',
        row: 'bg-gradient-to-r from-yellow-50/90 to-white dark:from-yellow-950/40 dark:to-slate-900 border-yellow-300 dark:border-yellow-700/60 text-yellow-950 dark:text-yellow-100 font-bold shadow-sm',
        medal: <i className="fa-solid fa-medal text-yellow-500 ml-1.5 text-base" title="Juara 1"></i>,
      };
    }
    if (rank === 2) {
      return {
        badge: 'bg-slate-300 text-slate-800 shadow ring-2 ring-slate-200',
        row: 'bg-gradient-to-r from-slate-100/80 to-white dark:from-slate-800/80 dark:to-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold',
        medal: <i className="fa-solid fa-medal text-slate-400 ml-1.5 text-base" title="Juara 2"></i>,
      };
    }
    if (rank === 3) {
      return {
        badge: 'bg-amber-600 text-white shadow ring-2 ring-amber-400/50',
        row: 'bg-gradient-to-r from-orange-50/80 to-white dark:from-orange-950/40 dark:to-slate-900 border-orange-200 dark:border-orange-800/60 text-amber-950 dark:text-amber-100 font-semibold',
        medal: <i className="fa-solid fa-medal text-amber-600 ml-1.5 text-base" title="Juara 3"></i>,
      };
    }
    return {
      badge: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      row: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200',
      medal: null,
    };
  };

  const renderMatchBanner = () => {
    if (matchStatus === 'selesai') {
      return (
        <div className="w-full max-w-5xl mb-5 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <i className="fa-solid fa-flag-checkered text-lg"></i>
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base">
                Pertandingan Telah Selesai — Peringkat Akhir Resmi Terkunci
              </h4>
              <p className="text-xs text-emerald-100">
                Peringkat telah dihitung otomatis berdasarkan waktu tercepat.
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider bg-white text-emerald-800 px-3 py-1 rounded-full">
            FINAL RESULT
          </span>
        </div>
      );
    }

    if (matchStatus === 'jeda') {
      return (
        <div className="w-full max-w-5xl mb-5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-800 dark:text-amber-300 px-5 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-semibold">
            <i className="fa-solid fa-circle-pause text-amber-500 text-lg"></i>
            <span>Pertandingan sedang dijeda sementara oleh panitia.</span>
          </div>
          <span className="text-xs bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full font-bold">
            PAUSED
          </span>
        </div>
      );
    }

    if (matchStatus === 'belum_mulai') {
      return (
        <div className="w-full max-w-5xl mb-5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-5 py-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <i className="fa-solid fa-clock text-slate-400"></i>
            <span>Pertandingan belum dimulai. Menunggu aba-aba dari Admin/Panitia.</span>
          </div>
          <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-full font-bold">
            STANDBY
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col items-center justify-start pt-2 w-full animate-fade-in pb-10">
      {/* Header Title */}
      <div className="flex items-center gap-3 mb-4">
        <i className="fa-solid fa-trophy text-amber-500 text-2xl"></i>
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Papan Peringkat Kelompok Praktikum
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Urutan otomatis berdasarkan Waktu Tercepat
          </p>
        </div>
      </div>

      {renderMatchBanner()}

      {/* Main Leaderboard Card Box */}
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-indigo-100 dark:border-slate-800 flex flex-col relative overflow-hidden card-hover transition-colors">
        {/* Card Header */}
        <div className="bg-indigo-50 dark:bg-slate-800/80 border-b border-indigo-100 dark:border-slate-700 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider text-sm">
              {boardTitle}
            </span>
            {matchStatus === 'selesai' ? (
              <span className="text-xs bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <i className="fa-solid fa-lock text-[10px]"></i> DATA TERKUNCI
              </span>
            ) : (
              <span className="text-xs bg-indigo-200 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-300 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping"></span>
                LIVE UPDATE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass text-slate-400 text-xs absolute left-3 top-2.5"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID / Nama Tim..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Display Mode Switch */}
            <div className="flex bg-indigo-100/80 dark:bg-slate-800 p-0.5 rounded-lg border border-indigo-200/50 dark:border-slate-700">
              <button
                onClick={() => setDisplayMode('table')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  displayMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-indigo-500 dark:text-slate-400 hover:text-indigo-800 dark:hover:text-white'
                }`}
                title="Tampilan Tabel Lengkap (PRD)"
              >
                <i className="fa-solid fa-table-list mr-1"></i> Tabel
              </button>
              <button
                onClick={() => setDisplayMode('card')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  displayMode === 'card'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'text-indigo-500 dark:text-slate-400 hover:text-indigo-800 dark:hover:text-white'
                }`}
                title="Tampilan Kartu"
              >
                <i className="fa-solid fa-grip-lines mr-1"></i> Kartu
              </button>
            </div>
          </div>
        </div>

        {/* Ranking Content */}
        <div className="w-full min-h-[320px] max-h-[540px] overflow-y-auto p-4">
          {filteredData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic flex flex-col items-center gap-2">
              <i className="fa-solid fa-clipboard-list text-3xl text-slate-300 dark:text-slate-600"></i>
              <span>Belum ada data peserta untuk papan peringkat ini...</span>
            </div>
          ) : displayMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider bg-slate-50/80 dark:bg-slate-800/60">
                    <th className="py-3 px-4 text-center w-20">Peringkat</th>
                    <th className="py-3 px-3">ID Peserta</th>
                    <th className="py-3 px-4">Nama Peserta / Tim</th>
                    <th className="py-3 px-4 text-center">Waktu (Kecepatan)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredData.map((row) => {
                    const style = getRankBadge(row.rank);
                    return (
                      <tr
                        key={row.id}
                        className={`transition-all duration-150 ${style.row}`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <div
                            className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-bold text-sm ${style.badge}`}
                          >
                            {row.rank}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          {row.participantId}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center">
                            <span className="text-base">{row.team}</span>
                            {style.medal}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg font-digital text-base border border-indigo-100 dark:border-indigo-800"
                            title="Waktu Penyelesaian"
                          >
                            <i className="fa-regular fa-clock mr-1.5"></i>
                            {row.timeStr}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(row.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredData.map((row) => {
                const style = getRankBadge(row.rank);
                return (
                  <div
                    key={row.id}
                    className={`flex flex-wrap justify-between items-center p-4 rounded-xl border transition-all duration-200 gap-3 ${style.row}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${style.badge}`}
                      >
                        {row.rank}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                            {row.participantId}
                          </span>
                          <span className="text-base tracking-wide flex items-center">
                            {row.team} {style.medal}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-[10px] uppercase text-slate-400 font-bold">
                          Waktu
                        </span>
                        <span className="font-digital text-xl text-slate-700 dark:text-slate-200">
                          {row.timeStr}
                        </span>
                      </div>
                      {getStatusBadge(row.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="bg-slate-50 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-indigo-500 dark:text-indigo-400"></i>
            <span>
              Total Peserta: <b>{rankedData.length} Tim</b> • Peringkat berdasarkan waktu tercepat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
