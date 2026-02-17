
import React, { useMemo } from 'react';
import { Product, Sale, Receivable } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

interface ReportsViewProps {
  sales: Sale[];
  products: Product[];
  receivables?: Receivable[];
  t: any;
}

const ReportsView: React.FC<ReportsViewProps> = ({ sales, products, receivables = [], t }) => {

  const handleExport = (type: 'sales' | 'inventory' | 'receivables') => {
    let data: any[] = [];
    let filename = '';

    if (type === 'sales') {
      data = sales;
      filename = `sales_report_${Date.now()}.csv`;
    } else if (type === 'inventory') {
      data = products;
      filename = `inventory_report_${Date.now()}.csv`;
    } else {
      data = receivables;
      filename = `receivables_report_${Date.now()}.csv`;
    }

    if (!data.length) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row =>
      Object.values(row).map(v =>
        typeof v === 'string' && v.includes(',') ? `"${v}"` : v
      ).join(",")
    ).join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const salesData = useMemo(() => {
    // Group sales by date (basic implementation)
    const grouped = sales.reduce((acc, sale) => {
      const date = new Date(sale.fecha).toLocaleDateString();
      acc[date] = (acc[date] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, total]) => ({ date, total }));
  }, [sales]);

  const brandValueData = useMemo(() => {
    const grouped = products.reduce((acc, p) => {
      acc[p.marca] = (acc[p.marca] || 0) + (p.stock_total * p.precio_venta_base);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([brand, value]) => ({ brand, value }));
  }, [products]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.reports}</h1>
          <p className="mt-1 text-sm text-slate-500">Advanced reports and operational analytics.</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => handleExport('sales')}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Export Sales
          </button>
          <button
            onClick={() => handleExport('inventory')}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Export Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <span className="material-icons text-primary">analytics</span>
            Daily Sales Trend
          </h3>
          <div className="h-64 w-full">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No sales data available</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <span className="material-icons text-primary">bar_chart</span>
            Inventory Value by Brand
          </h3>
          <div className="h-64 w-full">
            {brandValueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandValueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="brand" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No inventory data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-bold mb-4">Available Reports (Download)</h3>
        <div className="space-y-2">
          {[
            { name: 'Inventory Valuation (DGII)', action: () => handleExport('inventory') },
            { name: 'Daily Sales Log', action: () => handleExport('sales') },
            { name: 'Accounts Receivable Aging', action: () => handleExport('receivables') },
          ].map((report, i) => (
            <div key={i} onClick={report.action} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="material-icons text-slate-400 group-hover:text-primary">description</span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{report.name}</span>
              </div>
              <span className="material-icons text-slate-300 group-hover:text-primary text-sm">download</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
