import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, TrendingUp, DollarSign, ShoppingBag, Receipt, Award } from 'lucide-react';
import { Transaction } from '../types';

interface DailyReportProps {
  transactions: Transaction[];
  onSelectTransaction: (trx: Transaction) => void;
}

export default function DailyReport({ transactions, onSelectTransaction }: DailyReportProps) {
  // Helpers
  const formatPrice = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // 1. KPI Aggregations
  const totalRevenue = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.total, 0);
  }, [transactions]);

  const totalTransactionsCount = transactions.length;

  const averageOrderValue = useMemo(() => {
    if (totalTransactionsCount === 0) return 0;
    return Math.round(totalRevenue / totalTransactionsCount);
  }, [totalRevenue, totalTransactionsCount]);

  const totalItemsSold = useMemo(() => {
    return transactions.reduce((sum, t) => {
      const itemsCount = t.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      return sum + itemsCount;
    }, 0);
  }, [transactions]);

  // 2. Hourly Sales Aggregation (08:00 to 22:00 in clusters)
  const hourlyData = useMemo(() => {
    const hours = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'];
    const map: Record<string, number> = {
      '08:00-10:00': 0, '10:00-12:00': 0, '12:00-14:00': 0, '14:00-16:00': 0,
      '16:00-18:00': 0, '18:00-20:00': 0, '20:00-22:00': 0
    };

    transactions.forEach((t) => {
      const d = new Date(t.timestamp);
      const hour = d.getHours();
      
      if (hour >= 8 && hour < 10) map['08:00-10:00'] += t.total;
      else if (hour >= 10 && hour < 12) map['10:00-12:00'] += t.total;
      else if (hour >= 12 && hour < 14) map['12:00-14:00'] += t.total;
      else if (hour >= 14 && hour < 16) map['14:00-16:00'] += t.total;
      else if (hour >= 16 && hour < 18) map['16:00-18:00'] += t.total;
      else if (hour >= 18 && hour < 20) map['18:00-20:00'] += t.total;
      else if (hour >= 20 && hour <= 22) map['20:00-22:00'] += t.total;
    });

    return hours.map((range) => ({
      hour: range,
      Omzet: map[range]
    }));
  }, [transactions]);

  // 3. Best Seller Cake Analytics
  const bestSellers = useMemo(() => {
    const map: Record<string, { name: string; qty: number; sales: number }> = {};
    
    transactions.forEach((t) => {
      t.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.productName, qty: 0, sales: 0 };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].sales += item.price * item.quantity;
      });
    });

    return Object.values(map)
      .sort((a,b) => b.qty - a.qty)
      .slice(0, 5); // top 5
  }, [transactions]);

  // 4. Payment Methods Share
  const paymentMethodsShare = useMemo(() => {
    const list = [
      { name: 'Cash', value: 0 },
      { name: 'QRIS', value: 0 },
      { name: 'Debit', value: 0 },
      { name: 'Transfer', value: 0 }
    ];

    transactions.forEach((t) => {
      const match = list.find((item) => item.name === t.paymentMethod);
      if (match) match.value += 1;
    });

    // filter only methods used to prevent clutter on legends
    return list.filter(item => item.value > 0);
  }, [transactions]);

  const COLORS = ['#4A3525', '#0D9488', '#2563EB', '#D97706'];

  return (
    <div className="space-y-6" id="daily-sales-report-module">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F5F2EB]">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#4A3525]">Laporan Penjualan</h1>
          <p className="text-xs text-[#8C7D70] mt-1">Audit otomatis riwayat transaksi kasir dan kinerja produk hari ini.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-[#4A3525] rounded-xl text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5" />
          <span>Periode: Hari Ini</span>
        </div>
      </div>

      {/* KPI STATISTICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white border border-[#EDEAE4] rounded-2xl p-4 shadow-3xs">
          <div className="flex justify-between items-start text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-widest block">Total Omzet</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-xl font-serif font-extrabold text-[#4A3525] mt-1.5 block">
            {formatPrice(totalRevenue)}
          </h3>
          <p className="text-[9px] text-stone-400 mt-1">Dari total penjualan bersih</p>
        </div>

        {/* Total Transactions Count */}
        <div className="bg-white border border-[#EDEAE4] rounded-2xl p-4 shadow-3xs">
          <div className="flex justify-between items-start text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-widest block">Transaksi</span>
            <Receipt className="w-4 h-4 text-amber-700" />
          </div>
          <h3 className="text-xl font-serif font-extrabold text-[#4A3525] mt-1.5 block">
            {totalTransactionsCount} Struk
          </h3>
          <p className="text-[9px] text-stone-400 mt-1">Transaksi terdaftar lunas</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white border border-[#EDEAE4] rounded-2xl p-4 shadow-3xs">
          <div className="flex justify-between items-start text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-widest block">Rerata Struk (AOV)</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-xl font-serif font-extrabold text-[#4A3525] mt-1.5 block">
            {formatPrice(averageOrderValue)}
          </h3>
          <p className="text-[9px] text-stone-400 mt-1">Nilai belanja rata-rata</p>
        </div>

        {/* Total Items Sold */}
        <div className="bg-white border border-[#EDEAE4] rounded-2xl p-4 shadow-3xs">
          <div className="flex justify-between items-start text-stone-400">
            <span className="text-[10px] font-bold uppercase tracking-widest block">Kue Terjual</span>
            <ShoppingBag className="w-4 h-4 text-[#4A3525]" />
          </div>
          <h3 className="text-xl font-serif font-extrabold text-[#4A3525] mt-1.5 block">
            {totalItemsSold} Pcs
          </h3>
          <p className="text-[9px] text-stone-400 mt-1">Total rincian kuantitas produk</p>
        </div>
      </div>

      {/* CHARTS LAYER (Only if we have transactions, else show instructions) */}
      {totalTransactionsCount > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* HOURLY REVENUE CHART */}
          <div className="lg:col-span-8 bg-white border border-[#EDEAE4] rounded-2xl p-5 shadow-3xs">
            <h3 className="text-sm font-bold text-[#4A3525] mb-4">Grafik Jam Padat Penjualan Hari Ini</h3>
            <div className="h-64 select-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#8C7D70' }} axisLine-={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `Rp ${val / 1000}k`} tick={{ fontSize: 9, fill: '#8C7D70' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [formatPrice(Number(value)), 'Omzet']} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #EDE9DF', backgroundColor: '#FAF9F5' }} />
                  <Bar dataKey="Omzet" fill="#4A3525" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-stone-400 mt-3 text-center">Menampilkan total pendapatan kotor dari transaksi POS sesuai jam operasional toko</p>
          </div>

          {/* PAYMENT METHOD PIE CHART */}
          <div className="lg:col-span-4 bg-white border border-[#EDEAE4] rounded-2xl p-5 shadow-3xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#4A3525] mb-2">Metode Pembayaran Terfavorit</h3>
              <p className="text-[10px] text-stone-400 mb-4">Volume perbandingan pilihan transaksi pelanggan</p>
            </div>

            {paymentMethodsShare.length > 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
                <div className="w-full h-44 select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsShare}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentMethodsShare.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => [`${val} Transaksi`, 'Metode']} contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legends list */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-2 text-[10px] font-bold text-stone-600">
                  {paymentMethodsShare.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name}: {entry.value}x</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-stone-400 text-xs">Belum ada data metode terpilih</div>
            )}
          </div>

          {/* BEST SELLERS LEDGER DECK */}
          <div className="lg:col-span-4 bg-white border border-[#EDEAE4] rounded-2xl p-5 shadow-3xs">
            <div className="flex items-center gap-2 pb-4 border-b border-[#FAF9F5] mb-4">
              <Award className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-[#4A3525]">Top 5 Menu Paling Laris</h3>
            </div>
            
            <div className="space-y-3.5">
              {bestSellers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-900 border border-amber-500/15 flex items-center justify-center text-[10px] font-black">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-[#4A3525] truncate">{item.name}</h4>
                      <p className="text-[10px] text-stone-400 mt-0.5">{item.qty} Pcs laku terjual</p>
                    </div>
                  </div>
                  <span className="text-xs font-serif font-black text-amber-800 whitespace-nowrap pl-2">
                    {formatPrice(item.sales)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CHRONOLOGICAL TRANSACTIONS LOGS LIST */}
          <div className="lg:col-span-8 bg-white border border-[#EDEAE4] rounded-2xl p-5 shadow-3xs overflow-hidden">
            <h3 className="text-sm font-bold text-[#4A3525] mb-4">Arsip Log Struk Penjualan Hari Ini</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EDE9DF] text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    <th className="py-2.5 px-4 font-bold">Waktu</th>
                    <th className="py-2.5 px-3 font-bold">Invoice ID</th>
                    <th className="py-2.5 px-3 font-bold">Metode</th>
                    <th className="py-2.5 px-3 font-bold">Kuantitas</th>
                    <th className="py-2.5 px-3 text-right font-bold">Total Belanja</th>
                    <th className="py-2.5 px-4 text-center font-bold">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE9DF]">
                  {transactions.slice().reverse().map((t) => {
                    const totalQty = t.items.reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <tr key={t.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-2.5 px-4 text-stone-500 font-medium">
                          {new Date(t.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-600 font-semibold">{t.invoiceNo}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-600 font-bold rounded text-[9px] uppercase">
                            {t.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-stone-700">{totalQty} Pcs Kue</td>
                        <td className="py-2.5 px-3 text-right font-serif font-bold text-[#4A3525]">{formatPrice(t.total)}</td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => onSelectTransaction(t)}
                            className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                          >
                            Buka Struk
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#EDEAE4] rounded-2xl p-16 flex flex-col items-center justify-center text-stone-400">
          <Calendar className="w-12 h-12 text-stone-300 stroke-1 mb-2 animate-pulse" />
          <h4 className="font-semibold text-sm text-[#4A3525]">Belum Ada Aktivitas Penjualan</h4>
          <p className="text-[11px] text-stone-400 max-w-sm text-center mt-1">Sistem pencatatan laporan akan diisi secara otomatis begitu transaksi kasir pertama kali dituntaskan.</p>
        </div>
      )}
    </div>
  );
}
