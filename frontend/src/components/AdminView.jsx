import React, { useState } from 'react';
import DualTimerLane from './DualTimerLane';
import { calculateLeaderboard, formatTimeMs, parseTimeStrToMs } from '../utils/ranking';

export default function AdminView({
  activeTab,
  participants,
  matchStatus,
  onChangeMatchStatus,
  onAddParticipant,
  onUpdateParticipant,
  onDeleteParticipant,
  onDownloadExcel,
  isDownloading,
  onShowToast,
}) {
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // State form manual / edit
  const [formId, setFormId] = useState('');
  const [formTeam, setFormTeam] = useState('');
  const [formMissions, setFormMissions] = useState(1);
  const [formTimeStr, setFormTimeStr] = useState('01:10:000');
  const [formStatus, setFormStatus] = useState('Otomatis');

  const isFrozen = matchStatus === 'selesai';
  const rankedData = calculateLeaderboard(participants);
  const boardTitle = activeTab === 'lb1' ? 'Leaderboard 1' : 'Leaderboard 2';

  const nextIdA = `TIM-${String(participants.length + 1).padStart(3, '0')}`;
  const nextIdB = `TIM-${String(participants.length + 2).padStart(3, '0')}`;

  const openManualAdd = () => {
    if (isFrozen) {
      onShowToast('🔒 Pertandingan telah Selesai. Data terkunci!');
      return;
    }
    setEditingItem(null);
    setFormId(nextIdA);
    setFormTeam('');
    setFormMissions(1);
    setFormTimeStr('01:10:000');
    setFormStatus('Otomatis');
    setShowManualModal(true);
  };

  const openEditRow = (row) => {
    if (isFrozen) {
      onShowToast('🔒 Pertandingan telah Selesai. Skor terkunci (Freeze Data)!');
      return;
    }
    setEditingItem(row);
    setFormId(row.participantId || '');
    setFormTeam(row.team || '');
    setFormMissions(row.completedMissions ?? 1);
    setFormTimeStr(row.timeStr || formatTimeMs(row.timeMs));
    setFormStatus(row.customStatus || 'Otomatis');
    setShowManualModal(true);
  };

  const handleSaveManualForm = (e) => {
    e.preventDefault();
    if (!formTeam.trim()) {
      onShowToast('⚠️ Nama Peserta/Tim wajib diisi!');
      return;
    }
    const timeMs = parseTimeStrToMs(formTimeStr) || 60000;
    const completedMissions = Number(formMissions) || 1;

    if (editingItem) {
      onUpdateParticipant(editingItem.id, {
        participantId: formId.trim() || editingItem.participantId,
        team: formTeam.trim(),
        completedMissions,
        timeMs,
        timeStr: formatTimeMs(timeMs),
        customStatus: formStatus,
      });
    } else {
      onAddParticipant({
        participantId: formId.trim() || nextIdA,
        team: formTeam.trim(),
        completedMissions,
        timeMs,
        timeStr: formatTimeMs(timeMs),
        customStatus: formStatus,
      });
    }

    setShowManualModal(false);
    setEditingItem(null);
  };

  const confirmFinishMatch = () => {
    setShowFinishModal(false);
    onChangeMatchStatus('selesai');
  };

  const getStatusPill = (status) => {
    if (status === 'Pemenang') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
          🏆 Pemenang
        </span>
      );
    }
    if (status === 'Lolos') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          ✓ Lolos
        </span>
      );
    }
    if (status === 'Belum Full Misi') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          ⏳ Belum Full Misi
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        ✕ Gugur
      </span>
    );
  };

  return (
    <div className="flex flex-col w-full animate-fade-in pb-12">
      {/* ================= 5.1 MANAJEMEN STATUS PERTANDINGAN (PRD) ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 mb-6 flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
              matchStatus === 'selesai'
                ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                : matchStatus === 'berlangsung'
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                : matchStatus === 'jeda'
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <i
              className={`fa-solid ${
                matchStatus === 'selesai'
                  ? 'fa-lock'
                  : matchStatus === 'berlangsung'
                  ? 'fa-bolt'
                  : matchStatus === 'jeda'
                  ? 'fa-pause'
                  : 'fa-flag'
              }`}
            ></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Manajemen Status Pertandingan ({boardTitle})
              </h2>
              <span
                className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  matchStatus === 'selesai'
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                    : matchStatus === 'berlangsung'
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                    : matchStatus === 'jeda'
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {matchStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {matchStatus === 'selesai'
                ? 'Pertandingan selesai. Semua penambahan/perubahan skor telah dikunci (Freeze Data) dan peringkat diurutkan otomatis.'
                : 'Kelola jalannya pertandingan. Saat tombol Selesai ditekan, skor akan dikunci otomatis.'}
            </p>
          </div>
        </div>

        {/* Tombol Kontrol Status sesuai PRD 5.1 */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onChangeMatchStatus('berlangsung')}
            disabled={matchStatus === 'berlangsung' || matchStatus === 'selesai'}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white shadow-sm flex items-center gap-2 transition-all"
          >
            <i className="fa-solid fa-play"></i> Mulai Pertandingan
          </button>

          <button
            onClick={() => onChangeMatchStatus('jeda')}
            disabled={matchStatus !== 'berlangsung'}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white shadow-sm flex items-center gap-2 transition-all"
          >
            <i className="fa-solid fa-pause"></i> Jeda
          </button>

          {matchStatus !== 'selesai' ? (
            <button
              onClick={() => setShowFinishModal(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-2 transition-all"
            >
              <i className="fa-solid fa-flag-checkered"></i> Selesaikan Pertandingan
            </button>
          ) : (
            <button
              onClick={() => onChangeMatchStatus('berlangsung')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all"
              title="Buka kunci kembali untuk pengeditan darurat"
            >
              <i className="fa-solid fa-lock-open"></i> Buka Kunci Sesi
            </button>
          )}
        </div>
      </div>

      {/* Freeze Alert Banner jika Selesai */}
      {isFrozen && (
        <div className="mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-rose-800 dark:text-rose-200">
            <i className="fa-solid fa-shield-lock text-rose-600 dark:text-rose-400 text-xl"></i>
            <div className="text-sm">
              <span className="font-bold">Mode Freeze Data Aktif:</span> Pertandingan telah berstatus{' '}
              <b>Selesai</b>. Input skor baru dan perubahan data dinonaktifkan untuk menjaga integritas
              rekapitulasi.
            </div>
          </div>
          <button
            onClick={onDownloadExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow flex items-center gap-2"
          >
            <i className="fa-solid fa-file-excel"></i> Unduh Hasil (Excel)
          </button>
        </div>
      )}

      {/* Header Panel Kendali Waktu */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-stopwatch text-indigo-600 dark:text-indigo-400 text-xl"></i>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Panel Kendali Waktu
          </h2>
        </div>

        <button
          onClick={openManualAdd}
          disabled={isFrozen}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 transition-colors"
        >
          <i className="fa-solid fa-user-plus"></i> + Input Waktu Manual (Tanpa Timer)
        </button>
      </div>

      {/* Dual Timer Grid (Lajur A & Lajur B) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DualTimerLane
          laneLabel="Lajur A"
          accentColor="bg-blue-500"
          isFrozen={isFrozen}
          matchStatus={matchStatus}
          nextSuggestedId={nextIdA}
          onSaveParticipant={onAddParticipant}
          onShowToast={onShowToast}
        />

        <DualTimerLane
          laneLabel="Lajur B"
          accentColor="bg-indigo-500"
          isFrozen={isFrozen}
          matchStatus={matchStatus}
          nextSuggestedId={nextIdB}
          onSaveParticipant={onAddParticipant}
          onShowToast={onShowToast}
        />
      </div>

      {/* ================= TABEL REKAMAN DATA & PERINGKAT ADMIN ================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-6 border border-slate-200 dark:border-slate-800 w-full transition-colors">
        <div className="flex flex-wrap justify-between items-end mb-4 border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
              Hasil Rekaman Data &amp; Kalkulasi Peringkat Otomatis
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Target Papan:{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{boardTitle}</span> • Diurutkan
              berdasarkan Full 5 Misi &amp; Waktu Tercepat
            </p>
          </div>
          <button
            onClick={onDownloadExcel}
            disabled={isDownloading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <i className="fa-solid fa-file-excel"></i>
            {isDownloading ? 'Memproses Excel...' : 'Unduh Hasil (Excel)'}
          </button>
        </div>

        {rankedData.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic">
            Belum ada data rekaman untuk papan ini...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70">
                  <th className="py-3 px-3 text-center">Peringkat</th>
                  <th className="py-3 px-3">ID Peserta</th>
                  <th className="py-3 px-3">Nama Peserta / Tim</th>
                  <th className="py-3 px-3 text-center">Jumlah Misi yang Diselesaikan</th>
                  <th className="py-3 px-3 text-center">Waktu</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {rankedData.map((row) => {
                  let rankBadgeStyle = 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
                  if (row.rank === 1) rankBadgeStyle = 'bg-yellow-400 text-yellow-900 shadow-sm';
                  else if (row.rank === 2) rankBadgeStyle = 'bg-slate-300 text-slate-800';
                  else if (row.rank === 3) rankBadgeStyle = 'bg-amber-600 text-white';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <div
                          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-bold text-sm ${rankBadgeStyle}`}
                        >
                          {row.rank}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        {row.participantId}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">{row.team}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                          {row.completedMissions ?? 1} Misi
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-digital text-sm text-indigo-700 dark:text-indigo-400">
                        {row.timeStr}
                      </td>
                      <td className="py-3 px-3 text-center">{getStatusPill(row.status)}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditRow(row)}
                            disabled={isFrozen}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
                            title="Edit Waktu / Peserta"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => onDeleteParticipant(row.id)}
                            disabled={isFrozen}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
                            title="Hapus Peserta"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL KONFIRMASI SELESAIKAN PERTANDINGAN (PRD 7) ================= */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-6 animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <i className="fa-solid fa-flag-checkered text-xl"></i>
            </div>
            <h3 className="text-lg font-bold">
              Selesaikan Pertandingan &amp; Kunci Data?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Dengan mengonfirmasi, status pertandingan akan diubah menjadi <b>Selesai</b>:
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 mt-3 space-y-1.5 list-disc list-inside bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <li>Sistem mengunci seluruh input penambahan/perubahan skor (<b>Freeze Data</b>).</li>
              <li>Peringkat peserta diurutkan otomatis dari waktu tercepat ke terlama.</li>
              <li>Laporan akhir siap diunduh dalam format Excel (<code>.xlsx</code>).</li>
            </ul>
            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setShowFinishModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={confirmFinishMatch}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md"
              >
                Ya, Selesaikan Pertandingan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL INPUT / EDIT SKOR MANUAL ================= */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-6 animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {editingItem ? 'Edit Data & Waktu Peserta' : 'Input Waktu Peserta Baru'}
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveManualForm} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    ID Peserta
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-800 dark:text-slate-100"
                    placeholder="TIM-001"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Nama Peserta / Tim
                  </label>
                  <input
                    type="text"
                    value={formTeam}
                    onChange={(e) => setFormTeam(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100"
                    placeholder="Contoh: Kelompok Epsilon"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Jumlah Misi yang Diselesaikan
                </label>
                <select
                  value={formMissions}
                  onChange={(e) => setFormMissions(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Waktu (MM:SS:mmm)
                  </label>
                  <input
                    type="text"
                    value={formTimeStr}
                    onChange={(e) => setFormTimeStr(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-digital text-slate-800 dark:text-slate-100"
                    placeholder="01:12:500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Status Kelulusan
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100"
                  >
                    <option value="Otomatis">Otomatis (Sesuai Kecepatan &amp; Misi)</option>
                    <option value="Pemenang">Pemenang</option>
                    <option value="Lolos">Lolos</option>
                    <option value="Belum Full Misi">Belum Full Misi</option>
                    <option value="Gugur">Gugur</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
