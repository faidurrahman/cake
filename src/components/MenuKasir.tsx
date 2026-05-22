import React, { useState, useMemo } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { CartItem } from '../types';
import { jsPDF } from 'jspdf';

const generateReceiptPDF = (trx: any) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 140 + (trx.items.length * 10)] // Dynamic height based on items
  });

  // Fonts & styles
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(74, 53, 37); // #4A3525
  doc.text("CAKE CU", 40, 12, { align: "center" });

  doc.setFont("Helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(140, 125, 112); // Secondary color
  doc.text("Patisserie & Cakes", 40, 16, { align: "center" });
  doc.setFont("Helvetica", "normal");
  doc.text("Ruko Cake Cu, Jakarta", 40, 20, { align: "center" });

  // Divider Line
  doc.setDrawColor(210, 205, 195);
  doc.setLineWidth(0.3);
  doc.line(5, 23, 75, 23);

  // Metadata
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Invoice: ${trx.invoiceNo}`, 6, 28);
  doc.text(`Tanggal: ${new Date(trx.timestamp).toLocaleString('id-ID')}`, 6, 32);
  doc.text(`Metode: Cash`, 6, 36);
  doc.text(`Status: LUNAS`, 6, 40);

  // Divider Line
  doc.line(5, 43, 75, 43);

  // Items Headers
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(74, 53, 37);
  doc.text("MENU", 6, 47);
  doc.text("TOTAL", 74, 47, { align: "right" });

  let y = 53;
  trx.items.forEach((item: any) => {
    // Product Name
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(74, 53, 37);
    doc.text(item.productName, 6, y);
    
    // Qty and Subtotal
    y += 4;
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text(`${item.quantity} x Rp ${item.price.toLocaleString('id-ID')}`, 6, y);
    
    doc.setTextColor(74, 53, 37);
    doc.setFont("Helvetica", "bold");
    doc.text(`Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`, 74, y, { align: "right" });
    
    y += 6;
  });

  // Divider Line
  doc.line(5, y - 2, 75, y - 2);

  // Totals
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("Subtotal", 6, y + 3);
  const subtotalVal = trx.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  doc.text(`Rp ${subtotalVal.toLocaleString('id-ID')}`, 74, y + 3, { align: "right" });

  let currentY = y + 7;
  if (trx.shippingFee && trx.shippingFee > 0) {
    doc.text("Ongkos Kirim", 6, currentY);
    doc.text(`Rp ${trx.shippingFee.toLocaleString('id-ID')}`, 74, currentY, { align: "right" });
    currentY += 4;
  }

  // Divider
  doc.line(5, currentY - 1, 75, currentY - 1);

  // Final Total
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235); // Blue color for highlights
  doc.text("TOTAL BAYAR", 6, currentY + 3);
  doc.text(`Rp ${trx.total.toLocaleString('id-ID')}`, 74, currentY + 3, { align: "right" });

  // Thank You Footer
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Terima kasih atas pesanan Anda!", 40, currentY + 11, { align: "center" });
  doc.text("Silakan datang kembali", 40, currentY + 15, { align: "center" });

  // Save the PDF
  doc.save(`struk-${trx.invoiceNo.replace(/\//g, '-')}.pdf`);
};

export default function MenuKasir() {
  const { products, addTransaction, showAlert } = useData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingFee, setShippingFee] = useState<number>(0);

  // Helper formating IDR
  const formatPrice = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Add a product to the cart state
  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      showAlert('Stok produk habis!', 'warning');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        // Respect stock bounds
        if (existing.quantity >= product.stock) {
          showAlert(`Mencapai batas stok maksimum (${product.stock} pcs)`, 'warning');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  // Remove single line item completely
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Cart Subtotal
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  // Grand total
  const grandTotal = useMemo(() => {
    return subtotal + shippingFee;
  }, [subtotal, shippingFee]);

  // Pay and Save
  const handlePayAndSave = () => {
    if (cart.length === 0) {
      showAlert('Keranjang belanja kosong! Silakan pilih menu terlebih dahulu.', 'warning');
      return;
    }

    // Build items string description: "[Nama x Qty, Nama x Qty]"
    const itemsDescription = cart
      .map((item) => `${item.product.name} x ${item.quantity}`)
      .join(', ');

    const description = `Penjualan: [${itemsDescription}]` + (shippingFee > 0 ? ' + Ongkir' : '');

    // Pay and Save Transaction
    const trx = addTransaction({
      description: description,
      type: 'IN',
      amount: grandTotal,
      // Map items so that the warehouse stock is subtracted dynamically
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    });

    if (trx) {
      try {
        generateReceiptPDF(trx);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
      }
    }

    // Reset state post success
    setCart([]);
    setShippingFee(0);
    showAlert('Transaksi Berhasil Disimpan & Struk PDF Berhasil Terbuat!', 'success');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2 px-1" id="menu-kasir-container">
      {/* HEADER SECTION */}
      <div className="text-center md:text-left mb-2">
        <h2 className="text-xl font-extrabold text-stone-800 tracking-tight">Katalog Menu Kasir</h2>
        <p className="text-xs text-stone-500 mt-1">
          Pilih menu lezat di bawah untuk menambahkannya ke pesanan aktif.
        </p>
      </div>

      {/* 1. GRID PRODUK (1 kolom di mobile, 2 kolom di desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => {
          const isOutOfStock = product.stock <= 0;
          const cartItem = cart.find((item) => item.product.id === product.id);
          const cartQty = cartItem ? cartItem.quantity : 0;

          return (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={isOutOfStock}
              id={`product-card-${product.id}`}
              className={`relative flex flex-col justify-between w-full bg-white rounded-xl border p-4 transition-all duration-200 text-left focus:outline-hidden ${
                isOutOfStock
                  ? 'opacity-60 border-dashed border-stone-200 bg-stone-50 cursor-not-allowed'
                  : cartQty > 0
                  ? 'border-blue-400 bg-blue-50/5 ring-1 ring-blue-400 hover:border-blue-500'
                  : 'border-stone-200 bg-white hover:border-blue-300 hover:shadow-xs active:scale-[0.99]'
              }`}
            >
              {/* Name & Badge */}
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="font-bold text-stone-800 text-sm leading-snug">
                  {product.name}
                </div>
                {cartQty > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-extrabold rounded-md flex-shrink-0 animate-scale-up">
                    {cartQty}x
                  </span>
                )}
                {isOutOfStock && (
                  <span className="px-1.5 py-0.5 bg-stone-400 text-white text-[9px] font-bold rounded-sm uppercase tracking-wider">
                    Habis
                  </span>
                )}
              </div>

              {/* Description (jika ada) */}
              {product.description && (
                <p className="text-[11px] text-stone-400 line-clamp-1 mt-1 font-normal w-11/12">
                  {product.description}
                </p>
              )}

              {/* Price & Stock info */}
              <div className="flex items-end justify-between w-full mt-3.5 pt-2 border-t border-stone-100">
                <span className="text-[#3B82F6] font-bold text-xs font-sans">
                  {formatPrice(product.price)}
                </span>
                <span className="text-[10px] text-stone-400">
                  Stok: <span className="font-semibold text-stone-600">{product.stock}</span>
                </span>
              </div>
            </button>
          );
        })}

        {products.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-stone-400">
            <AlertCircle className="w-8 h-8 text-stone-300 mb-2 stroke-1" />
            <p className="text-xs">Produk belum terdaftar.</p>
          </div>
        )}
      </div>

      {/* 2. CURRENT ORDER / KERANJANG (Bagian Bawah) */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 md:p-6 shadow-xs mt-4" id="current-order-card">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
          <h3 className="text-sm font-extrabold text-stone-800 tracking-wide uppercase">
            Current Order
          </h3>
          {cart.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
            </span>
          )}
        </div>

        {/* Empty State */}
        {cart.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <span className="text-stone-400 text-xs font-medium">Belum ada pesanan</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* List pesanan */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between gap-4 p-3 bg-stone-50 rounded-xl border border-stone-100"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-stone-700 block truncate">
                      {item.product.name}
                    </span>
                    <span className="text-[10px] text-blue-500 font-semibold mt-0.5 inline-block">
                      {formatPrice(item.product.price)} x {item.quantity}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-extrabold text-stone-800 tabular-nums">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-7 h-7 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Ongkos Kirim */}
            <div className="pt-3 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-500 mb-1.5">
                Ongkos Kirim
              </label>
              <div className="flex items-center gap-2 bg-[#F8F9FA] px-4 py-2.5 rounded-xl border border-stone-200 focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500 max-w-sm">
                <span className="text-stone-400 font-bold text-xs font-sans">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={shippingFee || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setShippingFee(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-full bg-transparent font-bold text-stone-800 text-xs focus:outline-hidden text-right leading-none"
                />
              </div>
            </div>

            {/* Calculations and Total */}
            <div className="pt-4 border-t border-dashed border-stone-200 space-y-1 text-xs text-stone-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-700">{formatPrice(subtotal)}</span>
              </div>
              {shippingFee > 0 && (
                <div className="flex justify-between">
                  <span>Ongkos Kirim</span>
                  <span className="font-semibold text-stone-700">{formatPrice(shippingFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-stone-800 pt-2.5 border-t border-stone-200">
                <span className="text-stone-700 text-sm">Total Pembayaran</span>
                <span className="text-blue-600 font-sans font-black text-lg">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <button
                onClick={handlePayAndSave}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] hover:shadow-md text-white text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer text-center"
              >
                Bayar & Simpan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
