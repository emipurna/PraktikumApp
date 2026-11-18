import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import SpectatorView from './components/SpectatorView';
import LoginView from './components/LoginView';
import AdminView from './components/AdminView';
import { exportLeaderboardToExcel } from './utils/excelExport';
import {
  fetchLeaderboard,
  updateMatchStatus,
  updateMatchConfig,
  createParticipant,
  updateParticipant,
  deleteParticipant,
} from './utils/api';

const INITIAL_DB = {
  lb1: [
    {
      id: 'p-1',
      participantId: 'TIM-001',
      team: 'Kelompok Alpha',
      timeMs: 65500,
      timeStr: '01:05:500',
      customStatus: 'Otomatis',
    },
    {
      id: 'p-2',
      participantId: 'TIM-002',
      team: 'Kelompok Beta',
      timeMs: 72000,
      timeStr: '01:12:000',
      customStatus: 'Otomatis',
    },
    {
      id: 'p-3',
      participantId: 'TIM-003',
      team: 'Kelompok Charlie',
      timeMs: 78500,
      timeStr: '01:18:500',
      customStatus: 'Otomatis',
    },
  ],
  lb2: [
    {
      id: 'p-201',
      participantId: 'TIM-101',
      team: 'Tim RoboNova',
      timeMs: 68200,
      timeStr: '01:08:200',
      customStatus: 'Otomatis',
    },
  ],
};

const INITIAL_STATUS = {
  lb1: 'berlangsung',
  lb2: 'belum_mulai',
};

export default function App() {
  const [view, setView] = useState('user'); // 'user' | 'login' | 'admin'
  const [activeTab, setActiveTab] = useState('lb1');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch {
      // ignore
    }
  }, [darkMode]);

  const [database, setDatabase] = useState(() => {
    try {
      const saved = localStorage.getItem('leaderboard_prd_db');
      return saved ? JSON.parse(saved) : INITIAL_DB;
    } catch {
      return INITIAL_DB;
    }
  });

  const [matchStatusByBoard, setMatchStatusByBoard] = useState(() => {
    try {
      const saved = localStorage.getItem('leaderboard_prd_status');
      return saved ? JSON.parse(saved) : INITIAL_STATUS;
    } catch {
      return INITIAL_STATUS;
    }
  });

  const [eventConfig, setEventConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('leaderboard_prd_config');
      return saved
        ? JSON.parse(saved)
        : {
            eventName: 'Kompetisi_UAS_Robotika',
            eventDate: '2026-11-18',
          };
    } catch {
      return {
        eventName: 'Kompetisi_UAS_Robotika',
        eventDate: '2026-11-18',
      };
    }
  });

  const [toastMsg, setToastMsg] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  }, []);

  // Sinkronisasi data dari Backend Golang + PostgreSQL
  const syncBoardFromBackend = useCallback(async (boardId) => {
    try {
      const data = await fetchLeaderboard(boardId);
      setBackendConnected(true);
      setDatabase((prev) => ({
        ...prev,
        [boardId]: data.participants || [],
      }));
      if (data.matchStatus) {
        setMatchStatusByBoard((prev) => ({
          ...prev,
          [boardId]: data.matchStatus,
        }));
      }
      if (data.eventName || data.eventDate) {
        setEventConfig((prev) => ({
          eventName: data.eventName || prev.eventName,
          eventDate: data.eventDate || prev.eventDate,
        }));
      }
    } catch {
      setBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    syncBoardFromBackend(activeTab);
  }, [activeTab, syncBoardFromBackend]);

  // Live polling setiap 3 detik pada mode Penonton agar leaderboard selalu real-time
  useEffect(() => {
    if (view !== 'user') return undefined;
    const interval = setInterval(() => {
      syncBoardFromBackend(activeTab);
    }, 3000);
    return () => clearInterval(interval);
  }, [view, activeTab, syncBoardFromBackend]);

  useEffect(() => {
    try {
      localStorage.setItem('leaderboard_prd_db', JSON.stringify(database));
    } catch {
      // ignore storage errors
    }
  }, [database]);

  useEffect(() => {
    try {
      localStorage.setItem('leaderboard_prd_status', JSON.stringify(matchStatusByBoard));
    } catch {
      // ignore storage errors
    }
  }, [matchStatusByBoard]);

  useEffect(() => {
    try {
      localStorage.setItem('leaderboard_prd_config', JSON.stringify(eventConfig));
    } catch {
      // ignore storage errors
    }
  }, [eventConfig]);

  const currentParticipants = database[activeTab] || [];
  const currentMatchStatus = matchStatusByBoard[activeTab] || 'belum_mulai';

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      showToast(next ? '🌙 Mode Gelap diaktifkan' : '☀️ Mode Terang diaktifkan');
      return next;
    });
  };

  const handleToggleAuthView = () => {
    if (view === 'admin') {
      setView('user');
      setShowSettingsModal(false);
      showToast('👋 Berhasil Logout. Mode Peserta/Penonton aktif.');
    } else if (view === 'user') {
      setView('login');
    } else {
      setView('user');
    }
  };

  const handleLoginSuccess = (username) => {
    setView('admin');
    showToast(`✅ Login Berhasil! Selamat datang ${username}.`);
  };

  const handleChangeMatchStatus = async (newStatus) => {
    try {
      if (backendConnected) {
        await updateMatchStatus(activeTab, newStatus);
        await syncBoardFromBackend(activeTab);
      } else {
        setMatchStatusByBoard((prev) => ({
          ...prev,
          [activeTab]: newStatus,
        }));
      }

      if (newStatus === 'berlangsung') {
        showToast('🚀 Pertandingan dimulai! Timer & input waktu aktif.');
      } else if (newStatus === 'jeda') {
        showToast('⏸️ Pertandingan dijeda sementara.');
      } else if (newStatus === 'selesai') {
        showToast(
          '🏁 Pertandingan Selesai! Data telah dikunci (Freeze Data) & peringkat akhir diurutkan berdasarkan kecepatan.'
        );
      }
    } catch (err) {
      showToast(`❌ ${err.message || 'Gagal mengubah status pertandingan'}`);
    }
  };

  const handleAddParticipant = async (newParticipant) => {
    if (currentMatchStatus === 'selesai') {
      showToast('🔒 Pertandingan telah Selesai. Penambahan data dinonaktifkan!');
      return;
    }

    try {
      if (backendConnected) {
        await createParticipant({
          boardId: activeTab,
          ...newParticipant,
        });
        await syncBoardFromBackend(activeTab);
      } else {
        const entry = {
          id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ...newParticipant,
        };
        setDatabase((prev) => ({
          ...prev,
          [activeTab]: [...(prev[activeTab] || []), entry],
        }));
      }

      const boardLabel = activeTab === 'lb1' ? 'Leaderboard 1' : 'Leaderboard 2';
      showToast(`✅ Waktu ${newParticipant.team} berhasil disimpan ke ${boardLabel}!`);
    } catch (err) {
      showToast(`❌ ${err.message || 'Gagal menyimpan data peserta'}`);
    }
  };

  const handleUpdateParticipant = async (id, updatedFields) => {
    if (currentMatchStatus === 'selesai') {
      showToast('🔒 Pertandingan telah Selesai. Data tidak dapat diubah!');
      return;
    }

    try {
      if (backendConnected) {
        await updateParticipant(id, updatedFields);
        await syncBoardFromBackend(activeTab);
      } else {
        setDatabase((prev) => ({
          ...prev,
          [activeTab]: (prev[activeTab] || []).map((item) =>
            item.id === id ? { ...item, ...updatedFields } : item
          ),
        }));
      }

      showToast(`✅ Data peserta ${updatedFields.team} berhasil diperbarui!`);
    } catch (err) {
      showToast(`❌ ${err.message || 'Gagal memperbarui data peserta'}`);
    }
  };

  const handleDeleteParticipant = async (id) => {
    if (currentMatchStatus === 'selesai') {
      showToast('🔒 Pertandingan telah Selesai. Data tidak dapat dihapus!');
      return;
    }

    try {
      if (backendConnected) {
        await deleteParticipant(id);
        await syncBoardFromBackend(activeTab);
      } else {
        setDatabase((prev) => ({
          ...prev,
          [activeTab]: (prev[activeTab] || []).filter((item) => item.id !== id),
        }));
      }

      showToast('🗑️ Data peserta dihapus dari papan peringkat.');
    } catch (err) {
      showToast(`❌ ${err.message || 'Gagal menghapus data peserta'}`);
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (backendConnected) {
        await updateMatchConfig(activeTab, eventConfig.eventName, eventConfig.eventDate);
        await syncBoardFromBackend(activeTab);
      }
      setShowSettingsModal(false);
      showToast('✅ Pengaturan kompetisi disimpan.');
    } catch (err) {
      showToast(`❌ ${err.message || 'Gagal menyimpan pengaturan'}`);
    }
  };

  const handleDownloadExcel = async () => {
    if (currentParticipants.length === 0) {
      showToast('⚠️ Tidak ada data peserta untuk diunduh.');
      return;
    }

    try {
      setIsDownloading(true);
      showToast('⏳ Memproses laporan Excel (.xlsx)...');
      const boardTitle = activeTab === 'lb1' ? 'Leaderboard_1' : 'Leaderboard_2';

      const result = await exportLeaderboardToExcel({
        boardId: activeTab,
        boardTitle,
        eventName: eventConfig.eventName,
        eventDate: eventConfig.eventDate,
        participants: currentParticipants,
      });

      showToast(`✅ File ${result.fileName} berhasil diunduh (${result.source})!`);
    } catch (err) {
      console.error(err);
      showToast('❌ Gagal membuat file Excel.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* TOP NAVIGATION BAR */}
      <Navbar
        activeTab={activeTab}
        onSwitchTab={(tab) => setActiveTab(tab)}
        view={view}
        onToggleAuthView={handleToggleAuthView}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        eventConfig={eventConfig}
        matchStatus={currentMatchStatus}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative flex flex-col p-6 w-full max-w-7xl mx-auto">
        {view === 'user' && (
          <SpectatorView
            activeTab={activeTab}
            participants={currentParticipants}
            matchStatus={currentMatchStatus}
            eventConfig={eventConfig}
          />
        )}

        {view === 'login' && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onShowToast={showToast}
          />
        )}

        {view === 'admin' && (
          <AdminView
            activeTab={activeTab}
            participants={currentParticipants}
            matchStatus={currentMatchStatus}
            onChangeMatchStatus={handleChangeMatchStatus}
            onAddParticipant={handleAddParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            onDeleteParticipant={handleDeleteParticipant}
            onDownloadExcel={handleDownloadExcel}
            isDownloading={isDownloading}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* MODAL PENGATURAN KOMPETISI (Hanya untuk Admin) */}
      {showSettingsModal && view === 'admin' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full p-6 animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <i className="fa-solid fa-sliders text-indigo-600 dark:text-indigo-400"></i>
                <h3 className="text-lg font-bold">
                  Pengaturan Event &amp; Laporan Excel
                </h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Event (Digunakan pada Nama File Excel)
                </label>
                <input
                  type="text"
                  value={eventConfig.eventName}
                  onChange={(e) =>
                    setEventConfig((prev) => ({ ...prev, eventName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  placeholder="Kompetisi_UAS_Robotika"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tanggal Event
                  </label>
                  <input
                    type="date"
                    value={eventConfig.eventDate}
                    onChange={(e) =>
                      setEventConfig((prev) => ({ ...prev, eventDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold block text-slate-700 dark:text-slate-200 mb-1">
                  Format File Ekspor (PRD Bagian 7):
                </span>
                <code className="text-indigo-600 dark:text-indigo-400 font-mono break-all">
                  Hasil_Pertandingan_{eventConfig.eventName || 'Event'}_
                  {activeTab === 'lb1' ? 'Leaderboard_1' : 'Leaderboard_2'}_
                  {eventConfig.eventDate || '2026-11-18'}.xlsx
                </code>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">
                  {backendConnected ? '🟢 Terhubung ke Backend Go' : '🟡 Mode Offline (LocalStorage)'}
                </span>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow"
                >
                  Simpan &amp; Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed z-50 left-1/2 bottom-8 -translate-x-1/2 min-w-[260px] max-w-md bg-slate-900 text-white text-center rounded-xl px-5 py-3.5 text-sm font-medium shadow-xl border border-slate-700 animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
