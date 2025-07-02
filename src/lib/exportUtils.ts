// Universal export utility for CSV, Excel, and PDF
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportAsCSV(data: object[], filename = 'export.csv') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename, { bookType: 'csv' });
}

export function exportAsExcel(data: object[], filename = 'export.xlsx') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename, { bookType: 'xlsx' });
}

export function exportAsPDF(data: object[], filename = 'export.pdf') {
  const doc = new jsPDF();
  if (data.length === 0) {
    doc.text('No data to export', 10, 10);
  } else {
    const columns = Object.keys(data[0]);
    const rows = data.map(row => columns.map(col => (row as any)[col]));
    // @ts-ignore
    doc.autoTable({ head: [columns], body: rows });
  }
  doc.save(filename);
} 