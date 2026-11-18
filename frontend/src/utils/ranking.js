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
 * Peringkat HANYA berdasarkan kecepatan (waktu tercepat = peringkat 1).
 * Status otomatis: peringkat 1 = Pemenang, lainnya = Lolos.
 * Admin dapat menimpa status secara manual (Pemenang / Lolos / Gugur).
 */
export function calculateLeaderboard(participants = []) {
  const sorted = [...participants].sort((a, b) => {
    const timeA = a.timeMs > 0 ? a.timeMs : Number.MAX_SAFE_INTEGER;
    const timeB = b.timeMs > 0 ? b.timeMs : Number.MAX_SAFE_INTEGER;
    return timeA - timeB;
  });

  return sorted.map((item, idx) => {
    const rank = idx + 1;

    let computedStatus = item.customStatus;
    if (!computedStatus || computedStatus === 'Otomatis') {
      computedStatus = rank === 1 ? 'Pemenang' : 'Lolos';
    }

    return {
      ...item,
      rank,
      timeStr: item.timeStr || formatTimeMs(item.timeMs),
      status: computedStatus,
    };
  });
}
