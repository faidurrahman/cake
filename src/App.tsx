import { useState } from 'react';
import { Printer, Check, CakeSlice, LayoutGrid, Wallet, PackageOpen } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MenuKasir from './components/MenuKasir';
import CashBook from './components/CashBook';
import ProductManagement from './components/ProductManagement';
import { DataProvider, useData } from './context/DataContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('pos');

  const {
    products,
    transactions,
    cashFlows,
    selectedInvoice,
    setSelectedInvoice,
    addProduct,
    updateProduct,
    deleteProduct,
    addCashFlow,
    updateCashFlow,
    deleteCashFlow,
    syncDatabase,
    alert,
    confirm,
    closeAlert,
    closeConfirm,
  } = useData();

  const menuItems = [
    {
      id: 'pos',
      label: 'Menu Kasir',
      shortLabel: 'Kasir',
      icon: LayoutGrid,
    },
    {
      id: 'bukukas',
      label: 'Buku Kas',
      shortLabel: 'Buku Kas',
      icon: Wallet,
    },
    {
      id: 'products',
      label: 'Kelola Produk',
      shortLabel: 'Produk',
      icon: PackageOpen,
    }
  ];

  const getTabLabel = (id: string) => {
    switch (id) {
      case 'pos': return 'Menu Kasir (POS)';
      case 'bukukas': return 'Buku Kas';
      case 'products': return 'Kelola Produk';
      default: return 'Menu Kasir (POS)';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row bg-[#FCFAF6] min-h-screen text-[#4A3525] font-sans overflow-x-hidden antialiased" id="main-application-frame">
      
      {/* Mobile Top Navigation Bar */}
      <header className="lg:hidden flex items-center justify-between px-5 py-3.5 bg-white border-b border-[#EFECE6] sticky top-0 z-30 shadow-xs select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
            <span className="font-serif text-sm font-extrabold text-[#4A3525]">C</span>
          </div>
          <div>
            <h1 className="font-serif text-xs font-bold tracking-wider uppercase text-[#4A3525] leading-none mb-0.5">
              Cake Cu
            </h1>
            <p className="text-[9px] uppercase tracking-wider text-stone-400">Patisserie</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-800 font-bold bg-amber-100/70 border border-amber-200/50 px-2 py-0.5 rounded-full uppercase leading-none">
            {getTabLabel(activeTab)}
          </span>
        </div>
      </header>

      {/* Dynamic left branding sidebar navigation for Desktop */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Primary views panels drawer */}
      <main className="flex-1 p-4 md:p-6 pb-28 lg:pb-6 lg:overflow-y-auto lg:max-h-screen">
        
        {activeTab === 'pos' && (
          <MenuKasir />
        )}

        {activeTab === 'bukukas' && (
          <CashBook 
            cashFlows={cashFlows} 
            onAddCashFlow={addCashFlow} 
            onUpdateCashFlow={updateCashFlow}
            onDeleteCashFlow={deleteCashFlow}
            onSync={syncDatabase}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagement 
            products={products} 
            onAddProduct={addProduct} 
            onUpdateProduct={updateProduct} 
            onDeleteProduct={deleteProduct} 
          />
        )}

      </main>

      {/* Mobile Bottom Navigation Bar (Persistent, highly accessible and extremely premium) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/60 px-2 py-2 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.04)] select-none safe-bottom">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`mobile-nav-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-center transition-all duration-150 cursor-pointer text-ellipsis overflow-hidden"
            >
              <div 
                className={`p-1.5 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'scale-110 bg-[#4A3525] text-white shadow-xs' 
                    : 'text-stone-400 hover:text-[#4A3525]'
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <span 
                className={`text-[10px] tracking-tight mt-1 font-medium transition-colors ${
                  isActive 
                    ? 'text-[#4A3525] font-bold' 
                    : 'text-stone-400'
                }`}
              >
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* DETAILED ORIGINAL INVOICE REPRINT MODAL (Globally accessible when clicking "Buka Struk" from reports) */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="global-receipt-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-stone-200 shadow-2xl p-5 relative max-h-[92vh] flex flex-col">
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="text-center pb-5 border-b border-dashed border-stone-300">
                <div className="w-12 h-12 rounded-full border border-stone-200 mx-auto flex items-center justify-center bg-[#FAF9F5] mb-2">
                  <span className="font-serif text-lg font-bold text-[#4A3525]">C</span>
                </div>
                <h2 className="text-base font-serif font-bold text-[#4A3525] uppercase tracking-widest">
                  Cake Cu
                </h2>
                <p className="text-[10px] text-stone-400 tracking-wider">Cakes & Patisserie</p>
                <p className="text-[9px] text-[#8C7D70] mt-0.5">Ruko Contoh, Jakarta</p>
              </div>

              <div className="py-4 space-y-1.5 text-[11px] text-[#5C5046] border-b border-dashed border-stone-300">
                <div className="flex justify-between">
                  <span>No Invoice:</span>
                  <span className="font-mono font-semibold text-stone-800">{selectedInvoice.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date(selectedInvoice.timestamp).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-bold">{selectedInvoice.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">LUNAS (ARSIP)</span>
                </div>
              </div>

              <div className="py-4 space-y-2 border-b border-dashed border-stone-300 font-medium">
                {selectedInvoice.items.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between text-[#4A3525]">
                      <span>{item.productName}</span>
                      <span>{ (item.price * item.quantity).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }) }</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {item.quantity} x { item.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }) }
                    </div>
                  </div>
                ))}
              </div>

              <div className="py-4 space-y-2 text-xs text-[#5C5046]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{ (selectedInvoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0)).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }) }</span>
                </div>
                {selectedInvoice.shippingFee !== undefined && selectedInvoice.shippingFee > 0 && (
                  <div className="flex justify-between text-[#5C5046]">
                    <span>Ongkos Kirim</span>
                    <span>{ selectedInvoice.shippingFee.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }) }</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[#4A3525] text-sm pt-2 border-t border-stone-200">
                  <span>Total Bayar</span>
                  <span className="text-amber-800">{ (selectedInvoice.total).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }) }</span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Ulang Struk</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-full py-2.5 bg-[#4A3525] hover:bg-[#322318] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Tutup Arsip</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirm.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in" id="custom-confirm-dialog">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-stone-100 flex flex-col gap-4 text-center">
            <h2 className="text-base font-bold text-[#4A3525]">Konfirmasi</h2>
            <p className="text-xs text-stone-500 leading-relaxed">{confirm.message}</p>
            <div className="flex gap-3 justify-center mt-2">
              <button
                type="button"
                onClick={closeConfirm}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirm.onConfirm();
                  closeConfirm();
                }}
                className="px-4 py-2 bg-[#4A3525] hover:bg-[#322318] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM ALERT MODAL */}
      {alert.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in" id="custom-alert-dialog">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-stone-100 flex flex-col gap-4 text-center">
            <h2 className="text-base font-bold text-[#4A3525]">
              {alert.type === 'success' ? 'Sukses' : alert.type === 'error' ? 'Kesalahan' : alert.type === 'warning' ? 'Perhatian' : 'Info'}
            </h2>
            <p className="text-xs text-stone-500 leading-relaxed whitespace-pre-line">{alert.message}</p>
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={closeAlert}
                className="px-6 py-2 bg-[#C6A88B] hover:bg-[#BCA38F] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
