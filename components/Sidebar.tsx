
import React from 'react';
import { AppView, User } from '../types';

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  isOpen: boolean;
  user: User;
  t: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, user, t }) => {
  const navItems = [
    { view: AppView.DASHBOARD, label: t.dashboard, icon: 'dashboard' },
    { view: AppView.INVENTORY, label: t.inventory, icon: 'inventory_2' },
    { view: AppView.SALES, label: t.sales, icon: 'point_of_sale' },
    { view: AppView.CLIENTS, label: t.clients, icon: 'groups' },
    { view: AppView.RECEIVABLES, label: t.receivables, icon: 'account_balance_wallet' },
    { view: AppView.REPORTS, label: t.reports, icon: 'assessment' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 lg:relative ${isOpen ? 'w-64 translate-x-0' : 'w-20 lg:translate-x-0 -translate-x-full'} bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 flex-shrink-0 transition-all duration-300 flex flex-col shadow-sm`}>
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white shrink-0">
            <span className="material-icons text-xl">tire_repair</span>
          </div>
          {(isOpen || window.innerWidth >= 1024) && isOpen && <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white truncate">IM App</span>}
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scroll">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${activeView === item.view
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
          >
            <span className={`material-icons text-xl ${activeView === item.view ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>
              {item.icon}
            </span>
            {isOpen && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold relative overflow-hidden">
            {user?.avatar ? <img src={user.avatar} alt={user.nombre || ''} className="h-full w-full object-cover" /> : (user?.nombre || '?').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate text-white">{user?.nombre || 'User'}</h3>
            <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
