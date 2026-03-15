import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, Menu, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeout = setTimeout(() => {
      setNow(new Date());
      const interval = setInterval(() => {
        setNow(new Date());
      }, 60000);
      cleanupRef.current = () => clearInterval(interval);
    }, msUntilNextMinute);

    const cleanupRef = { current: () => {} };
    return () => {
      clearTimeout(timeout);
      cleanupRef.current();
    };
  }, []);

  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <span className="text-xs font-mono text-[#4b5e73] tabular-nums">
      {date} &middot; {time}
    </span>
  );
}

export function Header() {
  const { signOut } = useAuth();
  const { toggle, isMobile } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-[#e2ecf9] px-4 h-10 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={toggle}
            className="p-1 text-[#4b5e73] hover:text-[#0d1f35] rounded transition-colors"
          >
            <Menu size={18} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-4">
        {!isDashboard && (
          <>
            <LiveClock />
            <div className="h-4 w-px bg-[#e2ecf9]" />
          </>
        )}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 text-xs text-[#4b5e73] hover:text-[#0d1f35] transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[#dce8f5] flex items-center justify-center">
              <User size={12} className="text-[#1a56db]" />
            </div>
            <ChevronDown size={12} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#e2ecf9] rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={() => { setDropdownOpen(false); signOut(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
