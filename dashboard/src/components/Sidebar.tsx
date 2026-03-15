import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Building2,
  TrendingUp,
  BarChart3,
  Settings,
  X,
  PanelLeftClose,
  PanelLeft,
  MousePointerClick,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar, SidebarMode } from '@/contexts/SidebarContext';

const navGroups = [
  {
    label: 'Operations',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/orders', label: 'Orders', icon: ShoppingCart },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/forecast', label: 'Forecast', icon: TrendingUp },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/products', label: 'Products', icon: Package },
      { to: '/users', label: 'Users', icon: Users },
      { to: '/company', label: 'Company', icon: Building2 },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const pageLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/forecast': 'Forecast',
  '/analytics': 'Analytics',
  '/products': 'Products',
  '/users': 'Users',
  '/company': 'Company',
  '/settings': 'Settings',
};

const modeOptions: { mode: SidebarMode; icon: React.ElementType; label: string }[] = [
  { mode: 'hover', icon: MousePointerClick, label: 'Hover expand' },
  { mode: 'expanded', icon: PanelLeft, label: 'Expanded' },
  { mode: 'collapsed', icon: PanelLeftClose, label: 'Collapsed' },
];

export function Sidebar() {
  const { isOpen, mode, isExpanded, close, setMode, setHovered, isMobile } = useSidebar();
  const showExpanded = isMobile || isExpanded;
  const isCollapsed = !isMobile && !isExpanded;
  const isOverlay = mode === 'hover' && isExpanded && !isMobile;

  const sidebarContent = (
    <>
      {isMobile && (
        <div className="flex items-center justify-end mb-2 px-1">
          <button onClick={close} className="p-1.5 text-[#8FAABE]/50 hover:text-[#E8EDF2] rounded-md hover:bg-[#1A3755] transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-4" aria-label="Main navigation">
        {navGroups.map((group) => (
          <div key={group.label}>
            {showExpanded ? (
              <p className="text-[10px] font-semibold text-[#8FAABE]/50 uppercase tracking-widest mb-2 px-2">
                {group.label}
              </p>
            ) : (
              <div className="h-px bg-[#1E3F5E]/60 mx-1 mb-2" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => isMobile && close()}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-150 relative focus-visible:ring-2 focus-visible:ring-[#5B9BD5] focus-visible:outline-none',
                      isCollapsed ? 'justify-center' : '',
                      isActive
                        ? 'bg-[#1A3755] text-[#E8EDF2] shadow-sm'
                        : 'text-[#8FAABE]/80 hover:bg-[#152D4A] hover:text-[#E8EDF2]'
                    )
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={16} className={cn('flex-shrink-0', isActive ? 'text-[#5B9BD5]' : 'text-[#8FAABE]/50')} />
                      {showExpanded && <span>{item.label}</span>}
                      {isActive && showExpanded && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5B9BD5]" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {!isMobile && (
        <div className="mt-4 pt-3 border-t border-[#1E3F5E]/60">
          <div className={cn(
            'flex items-center gap-1 bg-[#0B1929]/50 rounded-md p-0.5',
            isCollapsed ? 'flex-col' : 'flex-row'
          )}>
            {modeOptions.map(({ mode: m, icon: Icon, label }) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-[#5B9BD5] focus-visible:outline-none',
                  isCollapsed ? 'w-8 h-8' : 'flex-1 py-1.5',
                  mode === m
                    ? 'bg-[#1A3755] text-[#E8EDF2]'
                    : 'text-[#8FAABE]/40 hover:text-[#E8EDF2]'
                )}
                title={label}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div className="fixed inset-0 top-10 bg-black/50 z-40 backdrop-blur-sm" onClick={close} />
        )}
        <aside
          className={cn(
            'fixed top-10 bottom-0 left-0 z-50 w-52 bg-gradient-to-b from-[#0B1929] to-[#0F2744] text-[#E8EDF2] p-3 flex flex-col transition-transform duration-200',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          'flex-shrink-0 transition-all duration-200',
          mode === 'expanded' ? 'w-52' : 'w-14'
        )}
      />
      <aside
        onMouseEnter={() => mode === 'hover' && setHovered(true)}
        onMouseLeave={() => mode === 'hover' && setHovered(false)}
        className={cn(
          'fixed top-10 bottom-0 left-0 bg-gradient-to-b from-[#0B1929] to-[#0F2744] text-[#E8EDF2] p-3 flex flex-col transition-all duration-200 flex-shrink-0',
          isOverlay ? 'z-40 shadow-2xl shadow-black/40' : 'z-30',
          isExpanded ? 'w-52' : 'w-14'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

/** Returns the page label for the current path */
export function usePageLabel() {
  const location = useLocation();
  const base = '/' + location.pathname.split('/')[1];
  return pageLabels[base] || 'Dashboard';
}
