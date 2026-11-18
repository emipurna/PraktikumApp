import React from 'react';

export default function Navbar({
  activeTab,
  onSwitchTab,
  view,
  onToggleAuthView,
  darkMode,
  onToggleDarkMode,
  eventConfig,
  matchStatus,
  onOpenSettings,
}) {
  const statusMeta = {
    belum_mulai: {
      label: 'Belum Mulai',
      cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    berlangsung: {
      label: 'Berlangsung',
      cls: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500 animate-pulse',
    },
    jeda: {
      label: 'Jeda Pertandingan',
      cls: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    selesai: {
      label: 'Selesai (Terkunci)',
      cls: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
  };

  const currentStatus = statusMeta[matchStatus] || statusMeta.belum_mulai;

  return (
    <nav className="flex flex-wrap items-center justify-between bg-white dark:bg-slate-900 px-6 py-3 shadow-sm border-b border-slate-200 dark:border-slate-800 shrink-0 z-10 relative gap-3 transition-colors duration-200">
      {/* Left: Settings (Hanya tampil jika login sebagai admin) & Title */}
      <div className="flex items-center gap-4">
        {view === 'admin' && (
          <button
            onClick={onOpenSettings}
            title="Pengaturan Kompetisi (Admin)"
            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 p-2 rounded-full h-10 w-10 flex items-center justify-center animate-fade-in"
          >
            <i className="fa-solid fa-gear text-lg"></i>
          </button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">
              Praktikum<span className="text-indigo-600 dark:text-indigo-400">App</span>
            </span>
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentStatus.cls}`}
            >
              <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`}></span>
              {currentStatus.label}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {eventConfig.eventName} • {eventConfig.eventDate}
          </span>
        </div>
      </div>

      {/* Center: Leaderboard Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => onSwitchTab('lb1')}
          className={
            activeTab === 'lb1'
              ? 'px-5 py-1.5 text-sm font-semibold rounded-md shadow bg-indigo-600 text-white transition-all'
              : 'px-5 py-1.5 text-sm font-semibold rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all'
          }
        >
          Leaderboard 1
        </button>
        <button
          onClick={() => onSwitchTab('lb2')}
          className={
            activeTab === 'lb2'
              ? 'px-5 py-1.5 text-sm font-semibold rounded-md shadow bg-indigo-600 text-white transition-all'
              : 'px-5 py-1.5 text-sm font-semibold rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all'
          }
        >
          Leaderboard 2
        </button>
      </div>

      {/* Right: Audio, Swipe Dark/Light Toggle, Login Button */}
      <div className="flex items-center gap-5">
        {/* Swipe Button: Dark Mode / Light Mode Toggle */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          title={darkMode ? 'Mode Gelap Aktif (Klik untuk Mode Terang)' : 'Mode Terang Aktif (Klik untuk Mode Gelap)'}
          onClick={onToggleDarkMode}
        >
          <i
            className={`fa-solid fa-sun text-xs transition-all duration-200 ${
              !darkMode ? 'text-amber-500 scale-110 drop-shadow' : 'text-slate-400'
            }`}
          ></i>
          
          <div className="relative inline-block w-11 h-6 align-middle">
            <input
              type="checkbox"
              id="darkmode-toggle"
              checked={darkMode}
              onChange={onToggleDarkMode}
              className="sr-only"
            />
            {/* Track */}
            <div
              className={`block w-11 h-6 rounded-full transition-colors duration-300 ${
                darkMode ? 'bg-indigo-600 shadow-inner' : 'bg-slate-300'
              }`}
            ></div>
            {/* Thumb */}
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center text-[10px] ${
                darkMode ? 'translate-x-5 text-indigo-600' : 'translate-x-0 text-amber-500'
              }`}
            >
              <i className={`fa-solid ${darkMode ? 'fa-moon' : 'fa-sun'}`}></i>
            </div>
          </div>

          <i
            className={`fa-solid fa-moon text-xs transition-all duration-200 ${
              darkMode ? 'text-indigo-400 scale-110 drop-shadow' : 'text-slate-400'
            }`}
          ></i>
        </div>

        {/* Login / Logout Admin Button */}
        <button
          onClick={onToggleAuthView}
          className={
            view === 'admin'
              ? 'px-4 py-2 text-sm font-semibold bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg shadow-sm transition-all flex items-center gap-2 border border-rose-200 dark:border-rose-900/50'
              : 'px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2'
          }
        >
          <i
            className={`fa-solid ${
              view === 'admin' ? 'fa-arrow-right-from-bracket' : 'fa-shield-halved'
            }`}
          ></i>
          <span>{view === 'admin' ? 'Logout Admin' : 'Login Admin'}</span>
        </button>
      </div>
    </nav>
  );
}
