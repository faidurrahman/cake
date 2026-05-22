import { useState, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Check, ArrowRight, Printer, AlertCircle } from 'lucide-react';
import { Product, CartItem, Transaction } from '../types';
import { CATEGORIES } from '../data';
import { useData } from '../context/DataContext';

interface CashierPOSProps {
  products: Product[];
  onAddTransaction: (transaction: Transaction) => void;
}

export default function CashierPOS({ products, onAddTransaction }: CashierPOSProps) {
  const { showAlert } = useData();
  // POS States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Debit' | 'Transfer'>('Cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [finalTransaction, setFinalTransaction] = useState<Transaction | null>(null);
  const [shippingFeeInput, setShippingFeeInput] = useState<string>('0');

  // Helper formatting currency
  const formatPrice = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Filter products based on search term and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        // Guard stock
        if (existing.quantity >= product.stock) return prevCart;
        return prevCart.map((item) => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          // Guard stock
          if (nextQty > item.product.stock) return item;
          return { ...item, quantity: nextQty };
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const shippingFee = useMemo(() => {
    const fee = parseFloat(shippingFeeInput) || 0;
    return fee >= 0 ? fee : 0;
  }, [shippingFeeInput]);

  const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

  // Change amount calculation
  const calculatedChange = useMemo(() => {
    const cash = parseFloat(cashAmount) || 0;
    if (cash < total) return 0;
    return cash - total;
  }, [cashAmount, total]);

  // Denominations for easy Cash input
  const denominations = [10000, 20000, 50000, 100000, 200000];

  const handleQuickPaid = (amount: number) => {
    setCashAmount(amount.toString());
  };

  // Submit purchase
  const handlePay = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Cash') {
      const cashVal = parseFloat(cashAmount) || 0;
      if (cashVal < total) {
        showAlert('Uang tunai yang dibayarkan kurang dari total belanja.', 'warning');
        return;
      }
    }

    const transactionId = 'TRX-' + Math.floor(100000 + Math.random() * 900000);
    const invoiceNo = 'TC/' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '/' + Math.floor(1000 + Math.random() * 9000);

    const transaction: Transaction = {
      id: transactionId,
      invoiceNo: invoiceNo,
      timestamp: new Date().toISOString(),
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
      total: total,
      shippingFee: shippingFee > 0 ? shippingFee : undefined,
      paymentMethod: paymentMethod,
      cashAmount: paymentMethod === 'Cash' ? (parseFloat(cashAmount) || total) : undefined,
      changeAmount: paymentMethod === 'Cash' ? calculatedChange : undefined,
    };

    onAddTransaction(transaction);
    setFinalTransaction(transaction);
    setCart([]);
    setShippingFeeInput('0');
    setIsCheckoutOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 p-4 overflow-y-auto lg:overflow-hidden bg-[#F8F9FA]" id="pos-cashier-screen">
      {/* LEFT: PRODUCTS LIST & CATALOG (Simpel tanpa foto, persis seperti screenshot) */}
      <div className="flex-1 flex flex-col h-full bg-white rounded-2xl border border-stone-200/60 p-5 overflow-hidden">
        {/* Header POS Search & Category */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center pb-4 border-b border-[#F7F5F0]">
          <div>
            <h2 className="text-lg font-bold text-stone-800">Katalog Patisserie</h2>
            <p className="text-xs text-stone-400 mt-0.5">Ketuk produk untuk menambah pesanan</p>
          </div>
          
          <div className="relative w-full sm:w-60">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-stone-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari kue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-[#E8E4DB] rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 bg-[#FCFBF8] text-stone-700"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 -mx-1 scrollbar-none flex-shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid (Seperti gambar: Putih, sudut membulat, nama di atas, harga biru mencolok di bawah) */}
        <div className="flex-1 overflow-y-auto pr-1 pb-4 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const inCart = cart.find(c => c.product.id === product.id);
            const cartQty = inCart ? inCart.quantity : 0;
            const hasReachedStock = cartQty >= product.stock;

            return (
              <div
                id={`product-card-${product.id}`}
                key={product.id}
                onClick={() => !isOutOfStock && !hasReachedStock && addToCart(product)}
                className={`relative flex flex-col justify-between bg-white rounded-xl border p-4 transition-all duration-200 ${
                  isOutOfStock 
                    ? 'opacity-60 border-dashed border-stone-200 bg-stone-50 cursor-not-allowed'
                    : cartQty > 0
                      ? 'border-blue-400 bg-blue-50/5 ring-1 ring-blue-400 cursor-pointer'
                      : 'border-stone-200/80 hover:border-blue-400 hover:shadow-xs cursor-pointer active:scale-98'
                }`}
              >
                {/* Status or Cart Qty Indicator */}
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  {isOutOfStock && (
                    <span className="px-1.5 py-0.5 bg-stone-500 text-white text-[8px] font-bold rounded uppercase tracking-wider">
                      Habis
                    </span>
                  )}
                  {cartQty > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded">
                      {cartQty}x
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col h-full justify-between pt-1">
                  <div>
                    <h3 className="text-xs font-semibold text-stone-800 leading-tight">
                      {product.name}
                    </h3>
                  </div>
                  
                  <div className="mt-3.5 pt-2 border-t border-stone-100 flex items-end justify-between">
                    <span className="text-xs font-bold text-blue-600">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-[9px] text-stone-400">
                      Stok: {product.stock}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-stone-400">
              <AlertCircle className="w-10 h-10 text-stone-300 stroke-1 mb-2" />
              <p className="text-xs font-medium">Kue tidak ditemukan.</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('Semua'); }}
                className="mt-2 text-xs font-bold text-amber-700 hover:underline"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: CURRENT ORDER (Matches the mockup beautifully and is fully responsive) */}
      <div className="w-full lg:w-[380px] flex flex-col bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex-shrink-0">
        <div>
          <h3 className="text-lg font-bold text-stone-800">Current Order</h3>
          <div className="h-[1px] bg-stone-100 w-full my-3" />
        </div>

        {/* Order list */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] lg:max-h-none mb-3">
          {cart.map((item) => (
            <div key={item.product.id} className="flex gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100 items-center justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-stone-700 truncate" title={item.product.name}>
                  {item.product.name}
                </h4>
                <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                  {formatPrice(item.product.price)} x {item.quantity} = {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>

              {/* Quantity Changer */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => updateQuantity(item.product.id, -1)}
                  className="w-5 h-5 rounded bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <span className="text-xs font-bold w-4 text-center text-stone-700">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.product.id, 1)}
                  className="w-5 h-5 rounded bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="w-5 h-5 text-stone-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer flex items-center justify-center"
                  title="Hapus"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-stone-400">
              <span className="text-xs font-medium text-stone-400">Belum ada pesanan</span>
            </div>
          )}
        </div>

        {/* Custom customizable Shipping Fee and grand total (Tampilan dan fungsionalitas persis seperti gambar) */}
        <div className="pt-3 border-t border-stone-100 space-y-4">
          <div>
            <div className="text-xs font-bold text-stone-500 mb-1.5">Ongkos Kirim</div>
            <div className="flex items-center gap-2 bg-[#F8F9FA] px-4 py-3.5 rounded-xl border border-stone-200/50">
              <span className="text-stone-500 font-bold text-sm">Rp</span>
              <input
                type="number"
                placeholder="0"
                value={shippingFeeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    setShippingFeeInput(val);
                  }
                }}
                className="w-full bg-transparent font-bold text-stone-800 text-sm focus:outline-hidden text-right focus:ring-0"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs text-stone-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {shippingFee > 0 && (
              <div className="flex justify-between">
                <span>Ongkos Kirim</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-stone-800 pt-2 border-t border-dashed border-stone-200">
              <span>Total Bayar</span>
              <span className="text-[#2563EB] font-sans font-extrabold text-base">{formatPrice(total)}</span>
            </div>
          </div>

          <button
            onClick={() => cart.length > 0 && setIsCheckoutOpen(true)}
            disabled={cart.length === 0}
            className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all duration-200 ${
              cart.length > 0
                ? 'bg-[#1E293B] text-white hover:bg-[#0F172A] shadow-xs cursor-pointer active:scale-98'
                : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
            }`}
          >
            <span>Lanjutkan Pembayaran</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CHECKOUT FLOW MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="checkout-drawer">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F7F5F0] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-[#4A3525]">Proses Pembayaran</h3>
                <p className="text-[11px] text-stone-400 mt-0.5">Selesaikan transaksi kasir</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Payment Bill Info */}
              <div className="bg-[#FAF8F5] border border-[#E9E5DE] rounded-xl p-4 text-center">
                <span className="text-xs text-stone-400">Total Tagihan Yang Harus Dibayar</span>
                <p className="text-2xl font-serif font-extrabold text-[#4A3525] mt-1 tracking-tight">
                  {formatPrice(total)}
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-[#4A3525] mb-2 uppercase tracking-wide">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Cash', 'QRIS', 'Debit', 'Transfer'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => {
                        setPaymentMethod(method);
                        setCashAmount(method === 'Cash' ? '' : total.toString());
                      }}
                      className={`py-3.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        paymentMethod === method
                          ? 'border-[#4A3525] bg-[#FAF5F0] text-[#4A3525] font-bold ring-1 ring-[#4A3525]'
                          : 'border-[#EDEBE5] hover:bg-stone-50 text-stone-500'
                      }`}
                    >
                      {method === 'Cash' && '💵 Tunai (Cash)'}
                      {method === 'QRIS' && '📱 QRIS Spontan'}
                      {method === 'Debit' && '💳 Kartu Debit'}
                      {method === 'Transfer' && '🏦 Transfer Bank'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Inputs based on Method */}
              {paymentMethod === 'Cash' ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-[#4A3525] mb-1.5 uppercase tracking-wide">
                      Jumlah Uang Diterima (IDR Cash)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-sm font-bold text-stone-400 pointer-events-none">
                        Rp
                      </span>
                      <input
                        type="number"
                        placeholder="Masukkan nominal..."
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 border border-[#E8E4DB] rounded-xl text-base font-bold text-[#4A3525] focus:outline-hidden focus:ring-1 focus:ring-amber-500 bg-[#FCFBF8]"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Hot keys for denominations */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => handleQuickPaid(total)}
                      className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs font-bold text-amber-800 hover:bg-amber-500/20 cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    {denominations
                      .filter((denom) => denom >= total)
                      .slice(0, 4)
                      .map((denom) => (
                        <button
                          key={denom}
                          onClick={() => handleQuickPaid(denom)}
                          className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-md text-xs font-semibold text-[#5C5046] hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          {formatPrice(denom)}
                        </button>
                      ))}
                  </div>

                  {/* Kembalian live feedback */}
                  {parseFloat(cashAmount) >= total && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-medium text-emerald-800">Kembalian:</span>
                      <span className="text-base font-bold text-emerald-700">{formatPrice(calculatedChange)}</span>
                    </div>
                  )}
                  {parseFloat(cashAmount) > 0 && parseFloat(cashAmount) < total && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-medium text-rose-800">Uang belum cukup! Kurang:</span>
                      <span className="text-xs font-bold text-rose-700">{formatPrice(total - parseFloat(cashAmount))}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* QRIS Mock Frame or Digital Processing */
                <div className="pt-2 flex flex-col items-center justify-center p-4 bg-[#FAF8F5] border border-[#E9E5DE] rounded-xl space-y-3">
                  {paymentMethod === 'QRIS' ? (
                    <>
                      <div className="w-40 h-40 bg-white border border-stone-200 rounded-lg p-2.5 flex flex-col items-center justify-center relative shadow-xs">
                        {/* High-quality minimalist decorative QR simulation */}
                        <div className="w-full h-full bg-gradient-to-br from-indigo-50/20 to-teal-50/20 flex flex-col gap-1 p-1">
                          <div className="flex justify-between">
                            <div className="w-8 h-8 border-4 border-[#4A3525]" />
                            <div className="w-8 h-8 border-4 border-[#4A3525]" />
                          </div>
                          {/* Inner abstract barcode maze */}
                          <div className="flex-1 flex flex-col justify-center items-center gap-1.5">
                            <div className="w-24 h-2 bg-stone-700 rounded-xs" />
                            <div className="w-20 h-2 bg-stone-500 rounded-xs" />
                            <div className="w-28 h-2 bg-stone-600 rounded-xs" />
                            <div className="w-16 h-2 bg-stone-400 rounded-xs" />
                          </div>
                          <div className="flex justify-between">
                            <div className="w-8 h-8 border-4 border-[#4A3525]" />
                            <div className="w-8 h-8 bg-[#4A3525] rounded-xs" />
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#4A3525] uppercase tracking-wider">
                        GPN QRIS TIFFANIES
                      </span>
                      <p className="text-[10px] text-stone-400 text-center px-6 leading-relaxed">
                        Mintalah pelanggan memindai kode di atas. Data transaksi akan otomatis tercatat ke buku kas utama setelah Anda menekan tombol "Konfirmasi Pembayaran".
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                        {paymentMethod === 'Debit' ? '💳' : '🏦'}
                      </div>
                      <span className="text-xs font-bold text-stone-700">
                        Mesin EDC / Setoran Bank manual
                      </span>
                      <p className="text-[10px] text-stone-400 text-center px-4 leading-relaxed">
                        Tekan "Konfirmasi Pembayaran" di bawah setelah pembayaran eksternal telah digesek/ditransfer secara sukses.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Action Button */}
            <div className="p-4 border-t border-[#F7F5F0] bg-white flex gap-2">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="flex-1 py-3 text-xs font-semibold border border-[#E3E0D6] rounded-xl text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-all cursor-pointer"
              >
                Kembali
              </button>
              <button
                onClick={handlePay}
                disabled={paymentMethod === 'Cash' && (parseFloat(cashAmount) || 0) < total}
                className={`flex-1 py-3 text-xs font-bold rounded-xl text-white transition-all ${
                  paymentMethod === 'Cash' && (parseFloat(cashAmount) || 0) < total
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                    : 'bg-[#4A3525] hover:bg-[#342418] shadow-lg shadow-[#4A3525]/10 cursor-pointer'
                }`}
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL TRANSACTION RECEIPT MODAL */}
      {finalTransaction && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="receipt-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-stone-200 shadow-2xl p-5 relative max-h-[92vh] flex flex-col">
            {/* Minimalist receipt content scroll view */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="text-center pb-5 border-b border-dashed border-stone-300">
                {/* Brand Header Minimal Re-invented */}
                <div className="w-12 h-12 rounded-full border border-stone-200 mx-auto flex items-center justify-center bg-[#FAF9F5] mb-2">
                  <span className="font-serif text-lg font-bold text-[#4A3525]">T</span>
                </div>
                <h2 className="text-base font-serif font-bold text-[#4A3525] uppercase tracking-widest">
                  Tiffany’s
                </h2>
                <p className="text-[10px] text-stone-400 tracking-wider">Cakes & Patisserie</p>
                <p className="text-[9px] text-[#8C7D70] mt-0.5">Ruko Kemang Indah Blok B-07, Jakarta</p>
              </div>

              {/* Receipt metadata */}
              <div className="py-4 space-y-1.5 text-[11px] text-[#5C5046] border-b border-dashed border-stone-300">
                <div className="flex justify-between">
                  <span>No Invoice:</span>
                  <span className="font-mono font-semibold text-stone-800">{finalTransaction.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date(finalTransaction.timestamp).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-bold">{finalTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">LUNAS</span>
                </div>
              </div>

              {/* Receipt Items list */}
              <div className="py-4 space-y-2 border-b border-dashed border-stone-300">
                {finalTransaction.items.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between font-medium text-[#4A3525]">
                      <span>{item.productName}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {item.quantity} x {formatPrice(item.price)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill totals checkout */}
              <div className="py-4 space-y-2 text-xs text-[#5C5046]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(finalTransaction.items.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
                </div>
                {finalTransaction.shippingFee !== undefined && finalTransaction.shippingFee > 0 && (
                  <div className="flex justify-between">
                    <span>Ongkos Kirim</span>
                    <span>{formatPrice(finalTransaction.shippingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[#4A3525] text-sm pt-2 border-t border-stone-200">
                  <span>Total Bayar</span>
                  <span className="text-amber-800">{formatPrice(finalTransaction.total)}</span>
                </div>

                {finalTransaction.paymentMethod === 'Cash' && (
                  <>
                    <div className="flex justify-between pt-1">
                      <span>Uang Tunai:</span>
                      <span>{formatPrice(finalTransaction.cashAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Kembalian:</span>
                      <span>{formatPrice(finalTransaction.changeAmount || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Thank you note */}
              <div className="text-center py-4 bg-[#FAF9F5] rounded-xl flex flex-col justify-center items-center">
                <span className="text-[11px] font-medium text-stone-500">Terima kasih atas pesanan Anda!</span>
                <span className="text-[10px] text-stone-400 mt-0.5">Kepuasan Anda adalah prioritas kami.</span>
              </div>
            </div>

            {/* Print and complete actions */}
            <div className="mt-5 space-y-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk Belanja</span>
              </button>
              <button
                onClick={() => setFinalTransaction(null)}
                className="w-full py-2.5 bg-[#4A3525] hover:bg-[#322318] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Halaman POS Baru</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
