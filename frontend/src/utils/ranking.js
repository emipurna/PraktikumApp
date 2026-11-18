/**
 * Format milidetik ke string waktu MM:SS:mmm
 */
export function formatTimeMs(ms) {
  if (!ms || ms < 0) return '00:00:000';
  const totalMs = Math.floor(ms);
  const minutes = String(Math.floor(totalMs / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((totalMs % 60000) / 1000)).padStart(2, '0');
  const milliseconds = String(totalMs % 1000).padStart(3, '0');
  return `${minutes}:${seconds}:${milliseconds}`;
}

/**
 * Parse string MM:SS:mmm menjadi milidetik
 */
export function parseTimeStrToMs(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 3) {
    return parts[0] * 60000 + parts[1] * 1000 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60000 + parts[1] * 1000;
  }
  return 0;
}

/**
 * Aturan Perangkingan:
 * 1. Peserta yang sudah menyelesaikan FULL 5 Misi berada di urutan teratas
 *    dan diurutkan berdasarkan kecepatan (waktu tercepat / timeMs terkecil = Peringkat 1).
 * 2. Peserta yang belum mencapai 5 misi diurutkan di bawahnya berdasarkan jumlah misi terbanyak
 *    lalu waktu tercepat.
 * 3. Status otomatis:
 *    - Jika full 5 misi: peringkat 1 = Pemenang, lainnya = Lolos.
 *    - Jika belum full (< 5 misi): Belum Full Misi.
 */
export function calculateLeaderboard(participants = []) {
  const sorted = [...participants].sort((a, b) => {
    const missionsA = Number(a.completedMissions) || 1;
    const missionsB = Number(b.completedMissions) || 1;

    // Prioritaskan peserta yang menyelesaikan misi lebih banyak (khususnya full 5 misi)
    if (missionsB !== missionsA) {
      return missionsB - missionsA;
    }

    // Jika jumlah misi sama (misal sama-sama 5 misi), urutkan berdasarkan waktu tercepat
    const timeA = a.timeMs > 0 ? a.timeMs : Number.MAX_SAFE_INTEGER;
    const timeB = b.timeMs > 0 ? b.timeMs : Number.MAX_SAFE_INTEGER;
    return timeA - timeB;
  });

  return sorted.map((item, idx) => {
    const rank = idx + 1;
    const completedMissions = Number(item.completedMissions) || 1;

    let computedStatus = item.customStatus;
    if (!computedStatus || computedStatus === 'Otomatis') {
      if (completedMissions >= 5) {
        computedStatus = rank === 1 ? 'Pemenang' : 'Lolos';
      } else {
        computedStatus = 'Belum Full Misi';
      }
    }

    return {
      ...item,
      rank,
      completedMissions,
      timeStr: item.timeStr || formatTimeMs(item.timeMs),
      status: computedStatus,
    };
  });
}
