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
 * Mengurutkan peserta sesuai PRD 5.2:
 * 1. Berdasarkan Total Skor tertinggi (Descending)
 * 2. Tie-breaker: Waktu penyelesaian tercepat / terkecil (Ascending)
 * 3. Menentukan peringkat (1, 2, 3...) dan Status (Pemenang / Lolos / Gugur)
 */
export function calculateLeaderboard(participants = [], passingScore = 60) {
  const sorted = [...participants].sort((a, b) => {
    const scoreDiff = (Number(b.totalScore) || 0) - (Number(a.totalScore) || 0);
    if (scoreDiff !== 0) return scoreDiff;
    // Tie-breaker: waktu penyelesaian tercepat (timeMs lebih kecil menang)
    const timeA = a.timeMs > 0 ? a.timeMs : Number.MAX_SAFE_INTEGER;
    const timeB = b.timeMs > 0 ? b.timeMs : Number.MAX_SAFE_INTEGER;
    return timeA - timeB;
  });

  return sorted.map((item, idx) => {
    const rank = idx + 1;
    const totalScore = Number(item.totalScore) || 0;

    let computedStatus = item.customStatus;
    if (!computedStatus || computedStatus === 'Otomatis') {
      if (rank === 1 && totalScore >= passingScore) {
        computedStatus = 'Pemenang';
      } else if (totalScore >= passingScore) {
        computedStatus = 'Lolos';
      } else {
        computedStatus = 'Gugur';
      }
    }

    return {
      ...item,
      rank,
      totalScore,
      timeStr: item.timeStr || formatTimeMs(item.timeMs),
      status: computedStatus,
    };
  });
}

