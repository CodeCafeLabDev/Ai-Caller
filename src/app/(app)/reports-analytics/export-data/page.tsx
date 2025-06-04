
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Export Data - Voxaiomni',
  description: 'Export various types of data, including call logs, campaign performance, and client information, in CSV or PDF formats.',
  keywords: ['export data', 'csv export', 'pdf export', 'data download', 'voxaiomni reports'],
};

export default function ExportDataPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Export Data (CSV/PDF)</h1>
      <p>This is a placeholder page for exporting data.</p>
      <p>Further development will include options to select data types, date ranges, and formats (CSV, PDF) for export.</p>
    </div>
  );
}
