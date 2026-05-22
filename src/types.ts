/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string; // Tailwind gradient descriptor or elegant icon name
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type CashFlowType = 'pemasukan' | 'pengeluaran';

export interface CashFlow {
  id: string;
  timestamp: string; // ISO String
  type: CashFlowType;
  amount: number;
  description: string;
  category: string; // e.g. "Penjualan", "Bahan Baku", "Operasional", "Lain-lain"
  referenceId?: string; // Links back to Transaction ID if from a sale
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  timestamp: string; // ISO String
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  shippingFee?: number;
  paymentMethod: 'Cash' | 'QRIS' | 'Debit' | 'Transfer';
  cashAmount?: number;
  changeAmount?: number;
}
