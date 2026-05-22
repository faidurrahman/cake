import { LayoutGrid, Wallet, PackageOpen, CakeSlice, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpenMobile, onCloseMobile }: SidebarProps) {
  const menuItems = [
    {
      id: 'pos',
      label: 'Menu Kasir (POS)',
      icon: LayoutGrid,
    },
    {
      id: 'bukukas',
      label: 'Buku Kas',
      icon: Wallet,
    },
    {
      id: 'products',
      label: 'Kelola Produk',
      icon: PackageOpen,
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 lg:hidden transition-opacity duration-300 animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Layout */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-[#EFECE6] flex flex-col justify-between select-none transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 h-full
          ${isOpenMobile ? 'translate-x-0 w-68 shadow-2xl' : '-translate-x-full lg:translate-x-0 w-68'}
        `}
      >
        <div>
          {/* Logo Section with Mobile Close Button */}
          <div className="py-8 flex flex-col items-center justify-center border-b border-[#F7F5F0] relative">
            {onCloseMobile && (
              <button 
                onClick={onCloseMobile}
                className="lg:hidden absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 bg-stone-100 rounded-full transition-colors cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="relative w-18 h-18 rounded-full border border-amber-500/30 flex items-center justify-center bg-gradient-to-br from-[#FCFBF7] to-[#FAF8F5] shadow-xs group cursor-pointer transition-all duration-300 hover:border-amber-500/70">
              {/* Minimalist modern graphic inner ring and sleek letter C */}
              <div className="w-14 h-14 rounded-full border border-dashed border-amber-600/20 flex items-center justify-center">
                <span className="font-serif text-3xl font-bold text-[#4A3525] tracking-wider transition-all duration-300 group-hover:scale-110">
                  C
                </span>
              </div>
              {/* Minimal decoration */}
              <span className="absolute -bottom-1 px-1.5 bg-white text-[9px] font-medium tracking-[0.2em] text-amber-600 uppercase">
                Est 2026
              </span>
            </div>
            
            <h1 className="mt-3 font-serif text-lg font-semibold tracking-[0.15em] text-[#4A3525] uppercase">
              Contoh Cake
            </h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium mt-0.5">
              Cakes & Patisserie
            </p>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="p-4 space-y-1.5 mt-4">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`sidebar-btn-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#4A3525] text-white shadow-md shadow-[#4A3525]/15 font-semibold'
                      : 'text-[#5C5046] hover:bg-[#FAF8F5] hover:text-[#4A3525]'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105 text-amber-300/90' : 'text-[#8C7D70]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Branding Information */}
        <div className="p-4 border-t border-[#F7F5F0] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-stone-400">
            <CakeSlice className="w-3.5 h-3.5 text-amber-600/70" />
            <span>New Identity POS v2.0</span>
          </div>
          <p className="text-[9px] text-stone-400 mt-0.5">Automated Cash Book & Reports</p>
        </div>
      </aside>
    </>
  );
}
