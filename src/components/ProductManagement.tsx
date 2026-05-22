import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../data';
import { useData } from '../context/DataContext';

interface ProductManagementProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export default function ProductManagement({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: ProductManagementProps) {
  const { showConfirm, showAlert } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New/Edit state variables
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1] || 'Semua');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [imageGradient, setImageGradient] = useState('');

  // We can treat image strings as class names (for gradients) or URLs if they are real images.
  const gradientPresets = [
    { name: 'Tiffany Teal', class: 'bg-gradient-to-tr from-cyan-400 to-teal-500' },
    { name: 'Choco Fudge', class: 'bg-gradient-to-tr from-amber-800 to-stone-900' },
    { name: 'Golden Honey', class: 'bg-gradient-to-tr from-amber-500 to-amber-700' },
    { name: 'Basque Amber', class: 'bg-gradient-to-tr from-amber-600 to-yellow-500' },
    { name: 'Lemon Custard', class: 'bg-gradient-to-tr from-yellow-300 to-amber-400' },
    { name: 'Sweet Raspberry', class: 'bg-gradient-to-tr from-rose-400 via-pink-400 to-teal-200' },
    { name: 'Matcha Green', class: 'bg-gradient-to-tr from-emerald-500 to-green-700' },
    { name: 'Velvet Rose', class: 'bg-gradient-to-tr from-rose-600 to-rose-800' }
  ];

  const formatPriceVal = (val: number) => {
    return val.toLocaleString('id-ID');
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory(CATEGORIES[1] || CATEGORIES[0]);
    setPrice('');
    setStock('');
    setDescription('');
    setImageGradient('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setDescription(product.description || '');
    setImageGradient(product.image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showAlert('Nama kue tidak boleh kosong.', 'warning');
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      showAlert('Harga produk tidak valid.', 'warning');
      return;
    }
    const stockNum = parseInt(stock) || 0;

    const productFields = {
      name: name.trim(),
      category: category,
      price: priceNum,
      stock: stockNum,
      description: description.trim() || undefined,
      image: imageGradient
    };

    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...productFields });
    } else {
      onAddProduct(productFields);
    }
    closeModal();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in pb-16 lg:pb-0" id="product-management-module">
      
      {/* HEADER */}
      <div className="space-y-1 mt-2">
        <h1 className="text-2xl font-bold text-[#4A3525] tracking-tight">Kelola Produk</h1>
        <p className="text-sm text-stone-500">Tambah, edit, atau hapus produk dari katalog.</p>
      </div>

      {/* ADD BUTTON */}
      <div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#C6A88B] hover:bg-[#BCA38F] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Tambah Produk
        </button>
      </div>

      {/* PRODUCT LIST */}
      <div className="bg-white border border-stone-200 rounded-[20px] overflow-hidden shadow-2xs">
        {/* Table Header Wrapper for scrolling if needed, but styling cleanly */}
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Header Row */}
            <div className="flex items-center px-5 py-4 border-b border-stone-200 text-[13px] font-medium text-stone-500 bg-white">
              <div className="w-20 sm:w-24">Gambar</div>
              <div className="flex-1 min-w-0">Nama Produk</div>
              <div className="w-28 sm:w-32 pr-6">Harga</div>
            </div>

            {/* List Body */}
            <div className="divide-y divide-stone-100 bg-white">
              {products.map((product) => (
                <div key={product.id} className="flex items-center px-4 py-4 hover:bg-stone-50/50 transition-colors">
                  
                  {/* Image Column */}
                  <div className="w-20 sm:w-24 pl-1">
                    {product.image && product.image.startsWith('http') ? (
                      <img src={product.image} alt={product.name} className="w-14 h-14 rounded-2xl object-cover shadow-xs border border-stone-100" />
                    ) : (
                      <div className={`w-14 h-14 rounded-2xl ${product.image || 'bg-[#F2ECE4] text-[#8C7A6B]'} shadow-xs border border-stone-100 flex items-center justify-center font-serif font-bold text-lg`}>
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Name Column */}
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-[15px] font-semibold text-stone-800 truncate">{product.name}</h3>
                  </div>

                  {/* Price Column */}
                  <div className="w-20 sm:w-24 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-[#C6A88B] leading-none mb-0.5">Rp</span>
                    <span className="text-[15px] font-bold text-[#C6A88B] leading-none">{formatPriceVal(product.price)}</span>
                  </div>

                  {/* Action Column */}
                  <div className="w-20 flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 text-stone-400 hover:text-[#C6A88B] transition-colors rounded-full hover:bg-stone-100 cursor-pointer"
                      aria-label="Edit Produk"
                      title="Edit Produk"
                    >
                      <Edit2 className="w-4.5 h-4.5" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => {
                        showConfirm(
                          `Apakah Anda yakin ingin menghapus produk "${product.name}" secara permanen?`,
                          () => onDeleteProduct(product.id)
                        );
                      }}
                      className="p-2 text-stone-400 hover:text-rose-600 transition-colors rounded-full hover:bg-stone-50 cursor-pointer"
                      aria-label="Hapus Produk"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-4.5 h-4.5" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              ))}

              {products.length === 0 && (
                <div className="px-5 py-12 text-center text-stone-400">
                  <AlertCircle className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="font-medium text-sm">Belum ada produk di katalog.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#4A3525]">
                {editingProduct ? 'Sunting Produk' : 'Tambah Produk Baru'}
              </h2>
              <button onClick={closeModal} className="p-2 -mr-2 text-stone-400 hover:text-stone-700 bg-stone-50 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 text-sm space-y-4">
              <form id="product-form" onSubmit={handleSaveProduct} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="block font-semibold text-stone-700">Nama Produk</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-[#C6A88B] bg-stone-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-stone-700">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-[#C6A88B] bg-stone-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-stone-700">Stok (Opsional)</label>
                    <input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-[#C6A88B] bg-stone-50"
                    />
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer (Fixed at bottom) */}
            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-3">
              {editingProduct ? (
                <button
                  type="button"
                  onClick={() => {
                    showConfirm(
                      `Hapus produk "${editingProduct.name}"?`,
                      () => {
                        onDeleteProduct(editingProduct.id);
                        closeModal();
                      }
                    );
                  }}
                  className="p-3 text-rose-500 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl font-bold flex-shrink-0 cursor-pointer transition-colors"
                  title="Hapus Produk"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 text-stone-500 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl font-bold flex-1 cursor-pointer transition-colors"
                >
                  Batal
                </button>
              )}
              
              <button
                type="submit"
                form="product-form"
                className="px-5 py-3 text-white bg-[#C6A88B] hover:bg-[#BCA38F] rounded-xl font-bold flex-1 shadow-xs cursor-pointer transition-colors"
              >
                {editingProduct ? 'Simpan' : 'Tambah Produk'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

