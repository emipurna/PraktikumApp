import ExcelJS from 'exceljs';
import { calculateLeaderboard } from './ranking';

/**
 * Menghasilkan nama file sesuai PRD Bagian 7:
 * Hasil_Pertandingan_[Nama_Event]_[Tanggal].xlsx
 */
export function buildExcelFilename(eventName = 'Kompetisi_UAS', eventDate = '') {
  const cleanEvent = (eventName || 'Kompetisi_UAS')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  const datePart =
    eventDate || new Date().toISOString().slice(0, 10);
  return `Hasil_Pertandingan_${cleanEvent}_${datePart}.xlsx`;
}

/**
 * Ekspor data peringkat ke file Excel (.xlsx) sesuai PRD Bagian 5.3:
 * - Mencoba memanggil endpoint backend Golang terlebih dahulu jika tersedia
 * - Jika backend belum aktif, melakukan generate file .xlsx terformat penuh
 *   (Header Bold + Highlight Warna + Auto-fit Column Width)
 * - Struktur Kolom Baku:
 *   1. Peringkat
 *   2. ID Peserta
 *   3. Nama Peserta/Tim
 *   4. Waktu Penyelesaian (kecepatan)
 *   5. Status (Lolos/Gugur/Pemenang)
 */
export async function exportLeaderboardToExcel({
  boardId,
  boardTitle,
  eventName,
  eventDate,
  participants,
}) {
  const rankedData = calculateLeaderboard(participants);
  const fileName = buildExcelFilename(`${eventName}_${boardTitle}`, eventDate);

  // 1. Coba panggil Backend Golang jika sudah berjalan
  try {
    const query = new URLSearchParams({
      board: boardId,
      event: `${eventName}_${boardTitle}`,
      date: eventDate || new Date().toISOString().slice(0, 10),
    });
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/api/matches/export?${query.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    });

    const contentType = response.headers.get('content-type') || '';
    if (
      response.ok &&
      contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ) {
      const blob = await response.blob();
      triggerBrowserDownload(blob, fileName);
      return { fileName, source: 'backend' };
    }
  } catch {
    // Backend belum dijalankan, gunakan generator .xlsx standar PRD
  }

  // 2. Generate .xlsx menggunakan ExcelJS dengan styling penuh sesuai PRD 5.3
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistem Manajemen Pertandingan & Peringkat Otomatis';
  workbook.created = new Date();

  const sheetName = (boardTitle || 'Leaderboard').slice(0, 31);
  const worksheet = workbook.addWorksheet(sheetName);

  // Definisi Struktur 6 Kolom Baku (PRD 5.3)
  worksheet.columns = [
    { header: 'Peringkat', key: 'rank', width: 14 },
    { header: 'ID Peserta', key: 'participantId', width: 18 },
    { header: 'Nama Peserta/Tim', key: 'team', width: 28 },
    { header: 'Jumlah Misi yang Diselesaikan', key: 'completedMissions', width: 30 },
    { header: 'Waktu (MM:SS:mmm)', key: 'timeStr', width: 22 },
    { header: 'Status', key: 'status', width: 18 },
  ];

  // Styling Baris Header: Bold + Latar Belakang Highlight (Indigo)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3730A3' }, // Indigo-800 highlight
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF1E1B4B' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Isi Baris Data Peserta
  rankedData.forEach((row) => {
    const dataRow = worksheet.addRow({
      rank: row.rank,
      participantId: row.participantId || `PESERTA-${String(row.rank).padStart(3, '0')}`,
      team: row.team,
      completedMissions: row.completedMissions ?? 1,
      timeStr: row.timeStr || '00:00:000',
      status: row.status,
    });

    dataRow.height = 22;

    dataRow.eachCell((cell, colNumber) => {
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: row.rank <= 3 || colNumber === 1 || colNumber === 4,
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 3 ? 'left' : 'center',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Highlight khusus juara 1 dan kolom status
      if (row.rank === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF9C3' }, // Soft gold highlight
        };
      } else if (row.rank % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    });
  });

  // Auto-Fit Lebar Kolom Otomatis berdasarkan panjang teks (PRD 5.3)
  worksheet.columns.forEach((column) => {
    let maxLength = column.header ? String(column.header).length : 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? String(cell.value) : '';
      if (cellValue.length > maxLength) {
        maxLength = cellValue.length;
      }
    });
    column.width = Math.max(maxLength + 5, 14);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  triggerBrowserDownload(blob, fileName);
  return { fileName, source: 'frontend-exceljs' };
}

function triggerBrowserDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

