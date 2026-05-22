import React, { useState, useMemo } from 'react';
import { RefreshCw, Download, ArrowDownRight, ArrowUpRight, Search, Calendar, Trash2, Edit2, Check, X, AlertCircle, CloudUpload, Copy } from 'lucide-react';
import { CashFlow, CashFlowType } from '../types';
import { useData } from '../context/DataContext';

interface CashBookProps {
  cashFlows: CashFlow[];
  onAddCashFlow: (entry: Omit<CashFlow, 'id' | 'timestamp'>) => void;
  onUpdateCashFlow: (updated: CashFlow) => void;
  onDeleteCashFlow: (id: string) => void;
  onSync: () => void;
}

export default function CashBook({
  cashFlows,
  onAddCashFlow,
  onUpdateCashFlow,
  onDeleteCashFlow,
  onSync,
}: CashBookProps) {
  const { products, importFromSheets, showConfirm, showAlert } = useData();

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date configuration based on current mock date ("2026-05-22")
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-05-31');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<CashFlowType>('pemasukan');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  
  // Edit State
  const [editingFlow, setEditingFlow] = useState<CashFlow | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Google Sheets Integration
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(() => {
    const saved = localStorage.getItem('tiffany_apps_script_url');
    const latestUrl = 'https://script.google.com/macros/s/AKfycbw4Mpld7J7P7BY_zfc1xzw1ntkAGgJQJtAiBLnTWjjYBhxFEx-ePqs89Cg7HVXF2FXX/exec';
    
    // Auto upgrade if browser is caching older predefined script URL versions
    const olderUrls = [
      'https://script.google.com/macros/s/AKfycbz4zO4-Jlx9PcaV5s5tljh602nUopLBOmlmyJNNv08lCEphzAeC23c3LoNUAosVkgSx/exec',
      'https://script.google.com/macros/s/AKfycbwvwqoEKJuMr1FAn6vj-cGLkm8rqTDMoMw3quEJXEa8Odj46LTaavx1Wgg-HwU2hS-A/exec'
    ];
    
    if (saved && olderUrls.includes(saved.trim())) {
      localStorage.setItem('tiffany_apps_script_url', latestUrl);
      return latestUrl;
    }
    return saved || latestUrl;
  });
  const [isSheetSyncing, setIsSheetSyncing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScript = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      } else {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = APPS_SCRIPT_CODE;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
      }
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      // Quiet fail if completely blocked
    }
  };

  // Send local App Data to Google Sheets
  const handleSheetExport = async () => {
    if (!sheetUrl.trim()) {
      showAlert('Masukkan URL Apps Script Web App yang valid.', 'warning');
      return;
    }

    setIsSheetSyncing(true);
    try {
      localStorage.setItem('tiffany_apps_script_url', sheetUrl.trim());

      const payload = {
        action: 'sync_all',
        products: products,
        cashflows: cashFlows,
      };

      await fetch(sheetUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      showAlert('Berhasil mengirim data! Data produk dan buku kas telah di-export ke Google Sheets.', 'success');
    } catch (err: any) {
      showAlert('Terjadi kesalahan saat mengekspor ke Google Sheets: ' + err.message, 'error');
    } finally {
      setIsSheetSyncing(false);
    }
  };

  // Pull data from Google Sheets to the local App
  const handleSheetImport = async () => {
    if (!sheetUrl.trim()) {
      showAlert('Masukkan URL Apps Script Web App yang valid.', 'warning');
      return;
    }

    setIsSheetSyncing(true);
    try {
      localStorage.setItem('tiffany_apps_script_url', sheetUrl.trim());

      const response = await fetch(sheetUrl.trim(), {
        method: 'GET',
      });

      const data = await response.json();
      if (data && data.status === 'success') {
        const importedProds = data.products || [];
        const importedFlows = data.cashflows || [];
        
        importFromSheets(importedProds, importedFlows);
        
        showAlert(`Berhasil menarik data! Diimpor ${importedProds.length} produk dan ${importedFlows.length} transaksi kas dari Google Sheets.`, 'success');
        setIsSheetModalOpen(false);
      } else {
        showAlert('Format respon dari Apps Script tidak dikenali atau gagal.', 'error');
      }
    } catch (err: any) {
      showAlert('Gagal menyambungkan ke Google Sheets. Pastikan Web App Anda di Apps Script diatur aksesnya ke "Anyone" (Siapa saja) dan Anda telah mempublikasikannya ulang.\n\nDetail kesalahan: ' + err.message, 'error');
    } finally {
      setIsSheetSyncing(false);
    }
  };

  // Formatted Rupiah
  const formatPrice = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Pre-configured Categories
  const incomeCategories = ['Penjualan Cake', 'Penjualan Kater', 'Investasi', 'Saldo Awal', 'Lain-lain'];
  const expenseCategories = ['Bahan Baku Roti', 'Kemasan & Kotak', 'Gaji Karyawan', 'Listrik & Air', 'Sewa Toko', 'Peralatan Baking', 'Lain-lain'];

  // Indonesian Date Formatting: e.g. "22 Mei 2026, 14.45"
  const formatIndonesianDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day} ${month === 'Mei' ? 'Mei' : month} ${year}, ${hours}.${minutes}`;
    } catch {
      return isoString;
    }
  };

  // Convert Date string for matching (YYYY-MM-DD comparisons)
  const isWithinDateRange = (timestamp: string) => {
    try {
      const dateStr = timestamp.substring(0, 10); // "YYYY-MM-DD"
      // If either bounds are undefined/empty or not set
      if (!startDate && !endDate) return true;
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    } catch {
      return true;
    }
  };

  // Calculate filtered ledger flows
  const filteredFlows = useMemo(() => {
    return cashFlows
      .filter((cf) => {
        const matchesSearch =
          cf.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cf.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDates = isWithinDateRange(cf.timestamp);
        return matchesSearch && matchesDates;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [cashFlows, searchTerm, startDate, endDate]);

  // Calculate stats based on CURRENT filter range matching the view!
  const totalPemasukan = useMemo(() => {
    return filteredFlows
      .filter((cf) => cf.type === 'pemasukan')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [filteredFlows]);

  const totalPengeluaran = useMemo(() => {
    return filteredFlows
      .filter((cf) => cf.type === 'pengeluaran')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [filteredFlows]);

  const saldoAkhir = useMemo(() => {
    return totalPemasukan - totalPengeluaran;
  }, [totalPemasukan, totalPengeluaran]);

  // Quick Preset Handlers
  const handleSetToday = () => {
    setStartDate('2026-05-22');
    setEndDate('2026-05-22');
  };

  const handleSetThisMonth = () => {
    setStartDate('2026-05-01');
    setEndDate('2026-05-31');
  };

  const handleSetAllTime = () => {
    setStartDate('');
    setEndDate('');
  };

  const isTodaySelected = startDate === '2026-05-22' && endDate === '2026-05-22';
  const isThisMonthSelected = startDate === '2026-05-01' && endDate === '2026-05-31';
  const isAllTimeSelected = startDate === '' && endDate === '';

  // Sync animation handler
  const handleSyncClick = () => {
    setIsSyncing(true);
    onSync();
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  // Export to CSV Function
  const exportToCSV = () => {
    if (filteredFlows.length === 0) {
      showAlert('Tidak ada data arus kas pada rentang ini untuk diekspor.', 'warning');
      return;
    }

    const headers = ['ID', 'Tanggal', 'Keterangan', 'Kategori', 'Pemasukan (IDR)', 'Pengeluaran (IDR)'];
    const rows = filteredFlows.map((cf) => [
      cf.id,
      formatIndonesianDate(cf.timestamp),
      cf.description.replace(/"/g, '""'),
      cf.category,
      cf.type === 'pemasukan' ? cf.amount : 0,
      cf.type === 'pengeluaran' ? cf.amount : 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Buku_Kas_${startDate || 'Semua'}_s.d_${endDate || 'Semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open transaction dialog in Create mode
  const openAddFlow = (type: CashFlowType) => {
    setEditingFlow(null);
    setModalType(type);
    setAmount('');
    setDescription('');
    setCategory('Umum');
    setIsModalOpen(true);
  };

  // Open transaction dialog in Edit mode
  const openEditFlow = (cf: CashFlow) => {
    setEditingFlow(cf);
    setModalType(cf.type);
    setAmount(String(cf.amount));
    setDescription(cf.description);
    setCategory(cf.category || 'Umum');
    setIsModalOpen(true);
  };

  // Handle Dialog Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showAlert('Masukkan jumlah uang yang valid.', 'warning');
      return;
    }
    if (!description.trim()) {
      showAlert('Harap isi keterangan transaksi.', 'warning');
      return;
    }

    if (editingFlow) {
      // Edit transaction mode
      onUpdateCashFlow({
        ...editingFlow,
        type: modalType,
        amount: amountVal,
        description: description,
        category: 'Umum',
      });
      showAlert('Transaksi Berhasil Diperbarui!', 'success');
    } else {
      // Create mode
      onAddCashFlow({
        type: modalType,
        amount: amountVal,
        description: description,
        category: 'Umum',
      });
      showAlert('Transaksi Berhasil Disimpan!', 'success');
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6" id="cash-book-module">
      
      {/* 1. HEADER SECTION (with EXACT layouts & action buttons) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 select-none">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#4A3525] tracking-tight">Buku Kas</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-200/50 animate-pulse">
              Sinkronisasi Aktif
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">Catat dan pantau arus kas Anda.</p>
        </div>

        {/* Action Button Groupings aligned exactly right */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Synchronize Button */}
          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            className={`px-4 py-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 focus:outline-hidden transition-all duration-150 cursor-pointer ${
              isSyncing ? 'opacity-85' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 focus:outline-hidden transition-all duration-150 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export CSV</span>
          </button>



          {/* Pengeluaran Red button */}
          <button
            onClick={() => openAddFlow('pengeluaran')}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 focus:outline-hidden transition-all duration-150 cursor-pointer"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            <span>↘ Pengeluaran</span>
          </button>

          {/* Pemasukan Green button */}
          <button
            onClick={() => openAddFlow('pemasukan')}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-1.5 focus:outline-hidden transition-all duration-150 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>↗ Pemasukan</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARD GRID (Replicates image 1 fully, matching total labels & formatting) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Pemasukan Card */}
        <div className="bg-white border border-[#EDEAE4] rounded-2xl p-5 shadow-xs transition-all duration-200">
          <span className="text-xs font-semibold text-stone-400">Total Pemasukan</span>
          <h2 className="text-2xl font-black text-[#10B981] mt-1.5 tracking-tight font-sans">
            {formatPrice(totalPemasukan)}
          </h2>
        </div>

        {/* Total Pengeluaran Card */}
        <div className="bg-white border border-[#EDEAE4] rounded-2xl p-5 shadow-xs transition-all duration-200">
          <span className="text-xs font-semibold text-stone-400">Total Pengeluaran</span>
          <h2 className="text-2xl font-black text-[#EF4444] mt-1.5 tracking-tight font-sans">
            {formatPrice(totalPengeluaran)}
          </h2>
        </div>

        {/* Saldo Akhir brown elegant card */}
        <div className="bg-[#4D3A2C] border border-[#3E2F23] rounded-2xl p-5 shadow-md">
          <span className="text-xs font-semibold text-stone-300">Saldo Akhir</span>
          <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight font-sans">
            {formatPrice(saldoAkhir)}
          </h2>
        </div>
      </div>

      {/* 3. RIWAYAT TRANSAKSI PANEL (incorporates search, date filtering, presets & ledger) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        
        {/* Panel Header & Search Row */}
        <div className="p-5 border-b border-stone-100/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-stone-800 text-sm tracking-wide">
            Riwayat Transaksi
          </h3>
          <div className="relative w-full md:w-68">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Search className="w-4 h-4 text-stone-400" />
            </span>
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500/40 text-stone-800"
            />
          </div>
        </div>

        {/* Date Filter & Preset Buttons Row */}
        <div className="px-5 py-3.5 bg-stone-50/50 border-b border-stone-100/90 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400 font-bold">Mulai:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400 font-bold">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end md:self-auto select-none">
            <button
              onClick={handleSetToday}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                isTodaySelected
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-700'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={handleSetThisMonth}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                isThisMonthSelected
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-700'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={handleSetAllTime}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                isAllTimeSelected
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-700'
              }`}
            >
              Semua Waktu
            </button>
          </div>
        </div>

        {/* 4. TABLE VIEWPORT (REPLICATES EXACTLY THE 5 SPECIFIED COLUMNS) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6] border-b border-stone-200/90 text-[10px] font-extrabold tracking-wider text-stone-400 uppercase select-none">
                <th className="py-3 px-5 text-left w-48">TANGGAL</th>
                <th className="py-3 px-4 text-left">KETERANGAN</th>
                <th className="py-3 px-4 text-right w-44">PEMASUKAN</th>
                <th className="py-3 px-4 text-right w-44">PENGELUARAN</th>
                <th className="py-3 px-5 text-center w-28">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredFlows.map((cf) => {
                const isIncome = cf.type === 'pemasukan';
                return (
                  <tr key={cf.id} className="hover:bg-amber-50/15 transition-all duration-150">
                    
                    {/* Timestamp Indonesian Format */}
                    <td className="py-3.5 px-5 font-medium text-stone-500 whitespace-nowrap">
                      {formatIndonesianDate(cf.timestamp)}
                    </td>

                    {/* Transaction Description */}
                    <td className="py-3.5 px-4 font-bold text-stone-800 break-words max-w-sm">
                      {cf.description}
                    </td>

                    {/* PEMASUKAN column value */}
                    <td className={`py-3.5 px-4 text-right font-black font-sans whitespace-nowrap text-[13px] ${
                      isIncome ? 'text-[#10B981]' : 'text-[#10B981]'
                    }`}>
                      {isIncome ? formatPrice(cf.amount) : '-'}
                    </td>

                    {/* PENGELUARAN column value */}
                    <td className={`py-3.5 px-4 text-right font-black font-sans whitespace-nowrap text-[13px] ${
                      !isIncome ? 'text-[#EF4444]' : 'text-[#EF4444]'
                    }`}>
                      {!isIncome ? formatPrice(cf.amount) : '-'}
                    </td>

                    {/* DOUBLE ACTION BUTTONS (Edit and Delete) */}
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        {/* Custom Edit Pencil helper */}
                        <button
                          onClick={() => openEditFlow(cf)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Ubah Catatan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Trash Button */}
                        <button
                          onClick={() => {
                            showConfirm('Apakah Anda yakin ingin menghapus catatan Buku Kas ini?', () => {
                              onDeleteCashFlow(cf.id);
                            });
                          }}
                          className="p-1 text-[#EF4444]/60 hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {cf.referenceId && (
                          <span className="text-[9px] text-stone-400 font-semibold uppercase bg-stone-100 px-1.5 py-0.5 rounded border" title="Arus kas dari Mesin POS">
                            POS
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredFlows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-stone-400 select-none">
                    <AlertCircle className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Tidak ditemukan riwayat kas pada rentang tanggal ini.</p>
                    <p className="text-[10px] text-stone-400 mt-1">Coba filter dengan rentang tanggal yang lebih luas atau lakukan sinkronisasi.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ADD / EDIT GENERAL TRANSACTIONS DIALOG (highly polished, supports updating) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="cashflow-dialog-form">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-sm w-full border border-stone-200 shadow-2xl overflow-hidden">
            {/* Form Header */}
            <div className={`p-4 border-b text-white ${modalType === 'pemasukan' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
              <div className="flex items-center justify-between select-none">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    {editingFlow ? 'Ubah Catatan Kas' : modalType === 'pemasukan' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
                  </h3>
                  <p className="text-[9px] text-white/70 mt-0.5">Catatan Kas Buku Utama</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form Fields body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Cash amount input */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-600 uppercase">Jumlah Uang (Rupiah)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-serif text-sm font-bold text-stone-400 pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 150000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-[#E3DFD5] rounded-xl text-[#4A3525] font-bold font-serif text-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* Description text area */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-600 uppercase">Keterangan</label>
                <textarea
                  required
                  placeholder={modalType === 'pemasukan' ? 'Sebutkan rincian kas masuk...' : 'Sebutkan pembelanjaan / pengeluaran...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E3DFD5] rounded-xl text-[#5C5046] focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-[#FCFBF8]"
                />
              </div>
            </div>

            {/* Form actions footer buttons */}
            <div className="p-4 bg-stone-50 border-t border-stone-100 flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold border border-stone-200 rounded-xl text-stone-500 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="submit"
                className={`flex-1 py-2 text-xs font-bold text-white rounded-xl transition-all duration-150 cursor-pointer ${
                  modalType === 'pemasukan' ? 'bg-emerald-600 hover:bg-emerald-700 font-bold' : 'bg-rose-600 hover:bg-rose-700 font-bold'
                }`}
              >
                {editingFlow ? 'Simpan Perubahan' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Google Sheets Sync Setup Modal */}
      {isSheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#4A3525]">Hubungkan Google Sheets</h2>
              </div>
              <button
                onClick={() => setIsSheetModalOpen(false)}
                className="p-1.5 hover:bg-stone-100 rounded-full text-stone-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4 text-stone-600">
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                <p className="font-semibold text-amber-900 mb-1">Spreadsheet ID Anda:</p>
                <code className="text-[10px] break-all bg-white px-2 py-1 rounded border border-stone-200 font-mono text-[#4A3525] block">
                  1pYEcABC0wS6yl0mlKDXu6s0DMaWH5J93PQKsgvN_i9g
                </code>
              </div>

              <div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-stone-700">URL Web App (Google Apps Script)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-800 text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-stone-50"
                  />
                  <p className="text-[10px] text-stone-400">
                    Masukkan URL deploy Web App dari Google Apps Script Anda untuk memulai sinkronisasi dua arah.
                  </p>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-3 space-y-2">
                <h3 className="font-bold text-[#4A3525]">Pilih Aksi Sinkronisasi:</h3>
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <button
                    type="button"
                    onClick={handleSheetImport}
                    disabled={isSheetSyncing}
                    className="p-3 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 disabled:bg-[#f6f6f6] rounded-xl flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw className={`w-5 h-5 text-emerald-600 ${isSheetSyncing ? 'animate-spin' : ''}`} />
                    <span className="font-bold text-[11px] leading-tight block">Tarik Data dari Sheets</span>
                    <span className="text-[10px] text-emerald-600 font-normal">Overwrites App dari data Sheet (kosongkan jika Sheet kosong)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSheetExport}
                    disabled={isSheetSyncing}
                    className="p-3 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 disabled:bg-[#f6f6f6] rounded-xl flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all"
                  >
                    <CloudUpload className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-[11px] leading-tight block">Kirim Data ke Sheets</span>
                    <span className="text-[10px] text-blue-600 font-normal">Kirim & timpa isi Sheet dengan data App saat ini</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-3 space-y-2">
                <h3 className="font-bold text-[#4A3525]">Langkah Konfigurasi Spreadsheet:</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-stone-500 leading-relaxed text-[11px]">
                  <li>Buka Spreadsheet Anda dengan ID di atas.</li>
                  <li>Buat dua tab sheet baru dengan nama: <strong className="text-stone-700">"Produk"</strong> dan <strong className="text-stone-700">"Buku Kas"</strong>.</li>
                  <li>Di menu atas, pilih <strong className="text-[#4A3525]">Extensions</strong> &rarr; <strong className="text-[#4A3525]">Apps Script</strong>.</li>
                  <li>
                    Hapus kode bawaan, lalu <strong className="text-emerald-700">copy-paste kode Google Apps Script</strong> yang dapat disalin di bawah ini:
                    <div className="mt-2 p-2 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-stone-500 truncate">Kode Google Apps Script Integrasi Dua Arah</span>
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                          copiedScript ? 'bg-emerald-600 text-white animate-pulse' : 'bg-[#4A3525] hover:bg-[#322318] text-white'
                        }`}
                      >
                        {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedScript ? 'Disalin!' : 'Salin Kode'}</span>
                      </button>
                    </div>
                  </li>
                  <li>Klik tombol <strong className="text-stone-700">Deploy &rarr; New deployment</strong> di kanan atas Apps Script.</li>
                  <li>Pilih jenis deployment <strong className="text-[#4A3525]">Web app</strong>. Atur "Execute as" ke <strong className="text-stone-700">Me</strong> dan "Who has access" ke <strong className="text-rose-600 font-bold">Anyone</strong>.</li>
                  <li>Salin link web app URL yang dihasilkan dan tempelkan pada kolom input di atas!</li>
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSheetModalOpen(false)}
                className="w-full py-2.5 text-stone-500 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl font-bold transition-colors cursor-pointer text-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const APPS_SCRIPT_CODE = `function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Ambil data dari tab "Produk"
    var products = [];
    var prodSheet = ss.getSheetByName("Produk");
    if (prodSheet) {
      var prodData = prodSheet.getDataRange().getValues();
      if (prodData.length > 1) { // Ada baris selain header
        for (var i = 1; i < prodData.length; i++) {
          products.push({
            id: prodData[i][0] ? prodData[i][0].toString() : '',
            name: prodData[i][1] ? prodData[i][1].toString() : '',
            category: prodData[i][2] ? prodData[i][2].toString() : '',
            price: Number(prodData[i][3]) || 0,
            stock: Number(prodData[i][4]) || 0,
            image: ''
          });
        }
      }
    }
    
    // 2. Ambil data dari tab "Buku Kas"
    var cashflows = [];
    var cashSheet = ss.getSheetByName("Buku Kas");
    if (cashSheet) {
      var cashData = cashSheet.getDataRange().getValues();
      if (cashData.length > 1) {
        for (var j = 1; j < cashData.length; j++) {
          cashflows.push({
            id: cashData[j][0] ? cashData[j][0].toString() : '',
            timestamp: cashData[j][1] ? new Date(cashData[j][1]).toISOString() : new Date().toISOString(),
            type: cashData[j][2] === 'pengeluaran' ? 'pengeluaran' : 'pemasukan',
            amount: Number(cashData[j][3]) || 0,
            description: cashData[j][4] ? cashData[j][4].toString() : '',
            category: cashData[j][5] ? cashData[j][5].toString() : 'Lain-lain'
          });
        }
      }
    }
    
    var response = {
      status: "success",
      products: products,
      cashflows: cashflows
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    if (data.action === 'sync_all') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // 1. Sinkronisasi Produk
      var prodSheet = ss.getSheetByName("Produk");
      if (!prodSheet) {
        prodSheet = ss.insertSheet("Produk");
      }
      prodSheet.clear();
      prodSheet.appendRow(["ID Produk", "Nama Produk", "Kategori", "Harga", "Stok"]);
      if (data.products && data.products.length > 0) {
        var prodRows = data.products.map(function(p) {
          return [p.id, p.name, p.category || '', p.price || 0, p.stock || 0];
        });
        prodSheet.getRange(2, 1, prodRows.length, 5).setValues(prodRows);
      }
      
      // 2. Sinkronisasi Buku Kas (Arus Kas)
      var cashSheet = ss.getSheetByName("Buku Kas");
      if (!cashSheet) {
        cashSheet = ss.insertSheet("Buku Kas");
      }
      cashSheet.clear();
      cashSheet.appendRow(["ID Transaksi", "Tanggal", "Tipe", "Jumlah", "Keterangan", "Kategori"]);
      if (data.cashflows && data.cashflows.length > 0) {
        var cashRows = data.cashflows.map(function(cf) {
          return [cf.id, cf.timestamp, cf.type, cf.amount, cf.description, cf.category];
        });
        cashSheet.getRange(2, 1, cashRows.length, 6).setValues(cashRows);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data synced successfully" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
