import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Transaction, CashFlow } from '../types';
import { INITIAL_PRODUCTS } from '../data';

interface DataContextType {
  products: Product[];
  transactions: Transaction[];
  cashFlows: CashFlow[];
  selectedInvoice: Transaction | null;
  setSelectedInvoice: (trx: Transaction | null) => void;
  addTransaction: (payload: {
    description: string;
    type: 'IN' | 'OUT';
    amount: number;
    items?: { productId: string; quantity: number }[];
  }) => Transaction;
  addProduct: (newProd: Omit<Product, 'id'>) => void;
  updateProduct: (updatedProd: Product) => void;
  deleteProduct: (id: string) => void;
  addCashFlow: (entry: Omit<CashFlow, 'id' | 'timestamp'>) => void;
  updateCashFlow: (updated: CashFlow) => void;
  deleteCashFlow: (id: string) => void;
  syncDatabase: () => void;
  importFromSheets: (importedProducts: Product[], importedCashFlows: CashFlow[]) => void;
  alert: { isOpen: boolean; message: string; type: 'success' | 'warning' | 'error' | 'info' };
  confirm: { isOpen: boolean; message: string; onConfirm: () => void };
  showAlert: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  closeAlert: () => void;
  closeConfirm: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
  }>({ isOpen: false, message: '', type: 'info' });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  const showAlert = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setAlertState({ isOpen: true, message, type });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmState({
      isOpen: true,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  // Initialize data on mount
  useEffect(() => {
    // 1. Products Initialization
    const cachedProducts = localStorage.getItem('tiffany_products');
    let initProducts: Product[] = [];
    if (cachedProducts) {
      initProducts = JSON.parse(cachedProducts);
    } else {
      initProducts = INITIAL_PRODUCTS;
      localStorage.setItem('tiffany_products', JSON.stringify(INITIAL_PRODUCTS));
    }
    setProducts(initProducts);

    // 2. Transactions Initialization (matching Pemasukan of Rp 355.000 is injected dynamically if empty)
    const cachedTransactions = localStorage.getItem('tiffany_transactions');
    let initTransactions: Transaction[] = [];
    if (cachedTransactions) {
      initTransactions = JSON.parse(cachedTransactions);
    } else {
      initTransactions = [
        {
          id: 'TRX-948219',
          invoiceNo: 'TC/20260522/2819',
          timestamp: '2026-05-22T04:15:00.000Z',
          items: [
            {
              productId: 'prod-1',
              productName: 'Original Pie',
              price: 120000,
              quantity: 2
            }
          ],
          total: 240000,
          paymentMethod: 'QRIS',
        }
      ];
      localStorage.setItem('tiffany_transactions', JSON.stringify(initTransactions));
    }
    setTransactions(initTransactions);

    // 3. Cash flows (Buku Kas) Initialization
    const cachedCashFlows = localStorage.getItem('tiffany_cashflows');
    let initFlows: CashFlow[] = [];
    if (cachedCashFlows) {
      initFlows = JSON.parse(cachedCashFlows);
    } else {
      initFlows = [
        {
          id: 'CF-AUTOMATE-1',
          timestamp: '2026-05-22T04:15:00.000Z',
          type: 'pemasukan',
          amount: 240000,
          description: 'Penjualan Otomatis POS TC/20260522/2819',
          category: 'Penjualan Cake',
          referenceId: 'TRX-948219'
        },
        {
          id: 'CF-MANUAL-2',
          timestamp: '2026-05-22T01:30:00.000Z',
          type: 'pengeluaran',
          amount: 250000,
          description: 'Restocking mentega premium & cokelat masak',
          category: 'Bahan Baku'
        }
      ];
      localStorage.setItem('tiffany_cashflows', JSON.stringify(initFlows));
    }
    setCashFlows(initFlows);

    // Auto-fetch in background from Google Sheets on startup
    const autoFetchFromSheets = async () => {
      const savedUrl = localStorage.getItem('tiffany_apps_script_url');
      const latestUrl = 'https://script.google.com/macros/s/AKfycbw4Mpld7J7P7BY_zfc1xzw1ntkAGgJQJtAiBLnTWjjYBhxFEx-ePqs89Cg7HVXF2FXX/exec';
      const sheetUrl = (savedUrl || latestUrl).trim();
      if (!sheetUrl) return;

      try {
        const response = await fetch(sheetUrl, {
          method: 'GET',
        });
        const data = await response.json();
        if (data && data.status === 'success') {
          const importedProds = data.products || [];
          const importedFlows = data.cashflows || [];
          
          if (Array.isArray(importedProds)) {
            setProducts(importedProds);
            localStorage.setItem('tiffany_products', JSON.stringify(importedProds));
          }
          if (Array.isArray(importedFlows)) {
            setCashFlows(importedFlows);
            localStorage.setItem('tiffany_cashflows', JSON.stringify(importedFlows));
          }
          console.log('Auto-fetched Google Sheets data on mount.');
        }
      } catch (err) {
        console.warn('Auto-fetch sheets data on mount failed:', err);
      }
    };
    
    setTimeout(() => {
      autoFetchFromSheets();
    }, 100);

  }, []);

  const triggerAutoSync = async (updatedProducts: Product[], updatedCashFlows: CashFlow[]) => {
    const savedUrl = localStorage.getItem('tiffany_apps_script_url');
    const latestUrl = 'https://script.google.com/macros/s/AKfycbw4Mpld7J7P7BY_zfc1xzw1ntkAGgJQJtAiBLnTWjjYBhxFEx-ePqs89Cg7HVXF2FXX/exec';
    const sheetUrl = (savedUrl || latestUrl).trim();
    if (!sheetUrl) return;

    try {
      const payload = {
        action: 'sync_all',
        products: updatedProducts,
        cashflows: updatedCashFlows,
      };

      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      console.log('Background Google Sheets auto-sync completed.');
    } catch (err) {
      console.warn('Background auto-sync failed:', err);
    }
  };

  const saveProducts = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem('tiffany_products', JSON.stringify(updated));
  };

  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const id = 'prod-' + (products.length + 1) + '-' + Math.floor(Math.random() * 100);
    const addedProd: Product = { id, ...newProd };
    const nextList = [...products, addedProd];
    saveProducts(nextList);
    triggerAutoSync(nextList, cashFlows);
  };

  const updateProduct = (updatedProd: Product) => {
    const nextList = products.map((p) => p.id === updatedProd.id ? updatedProd : p);
    saveProducts(nextList);
    triggerAutoSync(nextList, cashFlows);
  };

  const deleteProduct = (id: string) => {
    const nextList = products.filter((p) => p.id !== id);
    saveProducts(nextList);
    triggerAutoSync(nextList, cashFlows);
  };

  const addCashFlow = (entry: Omit<CashFlow, 'id' | 'timestamp'>) => {
    const id = 'CF-MANUAL-' + Math.floor(1000 + Math.random() * 9000);
    const addedFlow: CashFlow = {
      id: id,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    const nextFlows = [addedFlow, ...cashFlows];
    setCashFlows(nextFlows);
    localStorage.setItem('tiffany_cashflows', JSON.stringify(nextFlows));
    triggerAutoSync(products, nextFlows);
  };

  const updateCashFlow = (updated: CashFlow) => {
    const nextFlows = cashFlows.map((cf) => cf.id === updated.id ? updated : cf);
    setCashFlows(nextFlows);
    localStorage.setItem('tiffany_cashflows', JSON.stringify(nextFlows));
    triggerAutoSync(products, nextFlows);
  };

  const deleteCashFlow = (id: string) => {
    const nextFlows = cashFlows.filter((cf) => cf.id !== id);
    setCashFlows(nextFlows);
    localStorage.setItem('tiffany_cashflows', JSON.stringify(nextFlows));
    triggerAutoSync(products, nextFlows);
  };

  const addTransaction = (payload: {
    description: string;
    type: 'IN' | 'OUT';
    amount: number;
    items?: { productId: string; quantity: number }[];
  }) => {
    // 1. Deduct Stock
    let derivedProducts = [...products];
    if (payload.items && payload.items.length > 0) {
      derivedProducts = products.map((prod) => {
        const soldItem = payload.items?.find((item) => item.productId === prod.id);
        if (soldItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - soldItem.quantity),
          };
        }
        return prod;
      });
      saveProducts(derivedProducts);
    }

    // 2. Add Invoice log
    const transactionId = 'TRX-' + Math.floor(100000 + Math.random() * 900000);
    const invoiceNo = 'TC/' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '/' + Math.floor(1000 + Math.random() * 9000);

    const mappedItems = payload.items ? payload.items.map(cartItem => {
      const prod = derivedProducts.find(p => p.id === cartItem.productId);
      return {
        productId: cartItem.productId,
        productName: prod ? prod.name : 'Unknown Product',
        price: prod ? prod.price : 0,
        quantity: cartItem.quantity
      };
    }) : [];

    const newTrx: Transaction = {
      id: transactionId,
      invoiceNo: invoiceNo,
      timestamp: new Date().toISOString(),
      items: mappedItems,
      total: payload.amount,
      paymentMethod: 'Cash'
    };

    const nextTransactions = [newTrx, ...transactions];
    setTransactions(nextTransactions);
    localStorage.setItem('tiffany_transactions', JSON.stringify(nextTransactions));

    // 3. Connect as cashFlow to Ledger
    const cfId = 'CF-AUTO-' + Math.floor(10000 + Math.random() * 90000);
    const orderFlow: CashFlow = {
      id: cfId,
      timestamp: new Date().toISOString(),
      type: payload.type === 'IN' ? 'pemasukan' : 'pengeluaran',
      amount: payload.amount,
      description: payload.description,
      category: 'Penjualan Cake',
      referenceId: transactionId,
    };

    const nextFlows = [orderFlow, ...cashFlows];
    setCashFlows(nextFlows);
    localStorage.setItem('tiffany_cashflows', JSON.stringify(nextFlows));
    triggerAutoSync(derivedProducts, nextFlows);
    return newTrx;
  };

  const syncDatabase = () => {
    const nextFlows = [...cashFlows];
    let fixesInjected = false;

    transactions.forEach((trx) => {
      const existsInLedger = cashFlows.some((cf) => cf.referenceId === trx.id);
      if (!existsInLedger) {
        fixesInjected = true;
        nextFlows.push({
          id: 'CF-RECON-' + Math.floor(10000 + Math.random() * 90000),
          timestamp: trx.timestamp,
          type: 'pemasukan',
          amount: trx.total,
          description: `Penjualan Rekonsiliasi POS ${trx.invoiceNo}`,
          category: 'Penjualan Cake',
          referenceId: trx.id,
        });
      }
    });

    if (fixesInjected) {
      setCashFlows(nextFlows);
      localStorage.setItem('tiffany_cashflows', JSON.stringify(nextFlows));
      showAlert('Arus kas berhasil disinkronkan kembali dengan data invoice POS!', 'success');
      triggerAutoSync(products, nextFlows);
    } else {
      console.log('Database synced. Status: Reconciled.');
    }
  };

  const importFromSheets = (importedProducts: Product[], importedCashFlows: CashFlow[]) => {
    setProducts(importedProducts);
    localStorage.setItem('tiffany_products', JSON.stringify(importedProducts));
    
    setCashFlows(importedCashFlows);
    localStorage.setItem('tiffany_cashflows', JSON.stringify(importedCashFlows));

    // Clear transaction history to prevent inconsistencies with new sheet data
    setTransactions([]);
    localStorage.setItem('tiffany_transactions', JSON.stringify([]));
  };

  return (
    <DataContext.Provider
      value={{
        products,
        transactions,
        cashFlows,
        selectedInvoice,
        setSelectedInvoice,
        addTransaction,
        addProduct,
        updateProduct,
        deleteProduct,
        addCashFlow,
        updateCashFlow,
        deleteCashFlow,
        syncDatabase,
        importFromSheets,
        alert: alertState,
        confirm: confirmState,
        showAlert,
        showConfirm,
        closeAlert,
        closeConfirm,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
