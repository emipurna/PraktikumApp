import React, { useState } from 'react';

export default function LoginView({ onLoginSuccess, onShowToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      onShowToast('⚠️ Harap isi username dan password!');
      return;
    }
    onLoginSuccess(username.trim());
    setUsername('');
    setPassword('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] animate-fade-in pb-12">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-200 dark:border-indigo-800">
            <i className="fa-solid fa-shield-halved text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Admin Portal</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Masuk untuk mengelola status pertandingan, timer &amp; skor
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <i className="fa-regular fa-user absolute left-4 top-3.5 text-slate-400"></i>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (contoh: admin)"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
            />
          </div>
          <div className="relative">
            <i className="fa-solid fa-lock absolute left-4 top-3.5 text-slate-400"></i>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (contoh: admin123)"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            Masuk Sistem
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Demo Akses Cepat: ketik <code className="font-semibold text-slate-600 dark:text-slate-300">admin</code> /{' '}
            <code className="font-semibold text-slate-600 dark:text-slate-300">admin123</code>
          </span>
        </div>
      </div>
    </div>
  );
}
