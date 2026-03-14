import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, ChevronDown, User, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';

function LiveClock() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  useEffect(() => {
    // Sync to next minute boundary, then update every 60s
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    const timeout = setTimeout(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      const interval = setInterval(() => {
        setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      }, 60000);
      // Store cleanup for the interval
      cleanupRef.current = () => clearInterval(interval);
    }, msUntilNextMinute);

    const cleanupRef = { current: () => {} };
    return () => {
      clearTimeout(timeout);
      cleanupRef.current();
    };
  }, []);

  return (
    <span className="text-xs font-mono text-[#4b5e73] tabular-nums">{time}</span>
  );
}

export function Header() {
  const { signOut } = useAuth();
  const { toggle, isMobile } = useSidebar();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) {
      navigate(`/orders?search=${encodeURIComponent(q)}`);
      setSearchValue('');
    }
  }

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
        <form onSubmit={handleSearch} className="relative hidden sm:block">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8aa0b8]"
          />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-48 pl-8 pr-3 py-1 text-xs border border-[#e2ecf9] rounded-lg bg-[#f8fafd] focus:outline-none focus:ring-1 focus:ring-[#1a56db] focus:border-[#1a56db] focus:bg-white placeholder:text-[#8aa0b8] transition-colors"
          />
        </form>
      </div>
      <div className="flex items-center gap-4">
        <LiveClock />
        <div className="h-4 w-px bg-[#e2ecf9]" />
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
