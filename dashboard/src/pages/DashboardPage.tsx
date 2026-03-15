import { useState, useEffect, useMemo } from 'react';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';
import { format, startOfDay, subDays, endOfDay } from 'date-fns';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, ShoppingCart, Clock, Users, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { statusBadge } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { Order, Profile } from '@/types';

const PAGE_SIZE = 10;

// --- Sub-components ---

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  trend?: number;
}) {
  return (
    <div className="bg-white border border-[#e2ecf9] rounded-lg p-4 flex items-start gap-3">
      <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', accent)}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#8aa0b8] mb-0.5">{title}</p>
        <p className="text-lg font-bold text-[#0d1f35] leading-tight">{value}</p>
        {trend !== undefined ? (
          <div
            className={clsx('flex items-center gap-1 mt-1 text-[11px] font-medium', {
              'text-green-600': trend > 0,
              'text-red-500': trend < 0,
              'text-[#8aa0b8]': trend === 0,
            })}
          >
            {trend > 0 ? (
              <TrendingUp size={11} />
            ) : trend < 0 ? (
              <TrendingDown size={11} />
            ) : (
              <Minus size={11} />
            )}
            {trend === 0 ? 'No change' : `${Math.abs(trend).toFixed(0)}% vs yesterday`}
          </div>
        ) : (
          sub && <p className="text-[11px] text-[#8aa0b8] mt-1">{sub}</p>
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  completed: '#10b981',
  cancelled: '#ef4444',
};

function StatusDonutChart({ orders }: { orders: Order[] }) {
  const statuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
  const counts = statuses.map((s) => ({
    status: s,
    count: orders.filter((o) => o.status === s).length,
  }));
  const total = orders.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="48" fill="none" stroke="#e2ecf9" strokeWidth="14" />
        </svg>
        <p className="text-xs text-[#8aa0b8] mt-3">No orders to display</p>
      </div>
    );
  }

  // Build donut segments
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = counts
    .filter(({ count }) => count > 0)
    .map(({ status, count }) => {
      const pct = count / total;
      const dashLen = pct * circumference;
      const seg = {
        status,
        count,
        pct,
        dashLen,
        dashOffset: -offset,
        color: STATUS_COLORS[status],
      };
      offset += dashLen;
      return seg;
    });

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2ecf9" strokeWidth="14" />
          {segments.map((seg) => (
            <circle
              key={seg.status}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${seg.dashLen} ${circumference - seg.dashLen}`}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
              className="transition-all duration-500"
            />
          ))}
          <text x="60" y="56" textAnchor="middle" className="fill-[#0d1f35] text-lg font-bold" fontSize="18">
            {total}
          </text>
          <text x="60" y="72" textAnchor="middle" className="fill-[#8aa0b8]" fontSize="10">
            orders
          </text>
        </svg>
      </div>
      <div className="space-y-1.5 flex-1 min-w-0">
        {segments.map((seg) => (
          <div key={seg.status} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-[#4b5e73] capitalize flex-1">{seg.status}</span>
            <span className="text-xs font-semibold text-[#0d1f35] tabular-nums">{seg.count}</span>
            <span className="text-[10px] text-[#8aa0b8] w-8 text-right tabular-nums">
              {Math.round(seg.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---

export function DashboardPage() {
  const { orders, loading, error, refetch } = useRealtimeOrders();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const [collectors, setCollectors] = useState<Profile[]>([]);
  const [collectorsLoading, setCollectorsLoading] = useState(true);

  const [yesterdayData, setYesterdayData] = useState<{
    revenue: number;
    orders: number;
    collectors: number;
  } | null>(null);

  useEffect(() => {
    async function fetchYesterday() {
      const yesterday = subDays(new Date(), 1);
      const start = startOfDay(yesterday).toISOString();
      const end = endOfDay(yesterday).toISOString();

      const { data } = await supabase
        .from('orders')
        .select('total_amount, status, collector_id')
        .gte('created_at', start)
        .lte('created_at', end);

      if (data) {
        setYesterdayData({
          revenue: data.filter((o) => o.status === 'completed').reduce((sum, o) => sum + (o.total_amount || 0), 0),
          orders: data.length,
          collectors: new Set(data.map((o) => o.collector_id)).size,
        });
      }
    }

    async function fetchCollectors() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'collector')
        .eq('is_active', true)
        .order('nickname');
      setCollectors((data as Profile[]) || []);
      setCollectorsLoading(false);
    }

    fetchYesterday();
    fetchCollectors();
  }, []);

  const { pendingOrders, todayOrders, todayRevenue, activeCollectors } = useMemo(() => {
    const today = new Date().toDateString();
    const pending = orders.filter((o) => o.status === 'pending');
    const todayOrd = orders.filter((o) => new Date(o.created_at).toDateString() === today);
    const revenue = todayOrd
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total_amount, 0);
    const collectorCount = new Set(todayOrd.map((o) => o.collector_id)).size;
    return { pendingOrders: pending, todayOrders: todayOrd, todayRevenue: revenue, activeCollectors: collectorCount };
  }, [orders]);

  const trends = useMemo(() => {
    if (!yesterdayData) return { revenue: undefined, orders: undefined, collectors: undefined };
    function calc(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    }
    return {
      revenue: calc(todayRevenue, yesterdayData.revenue),
      orders: calc(todayOrders.length, yesterdayData.orders),
      collectors: calc(activeCollectors, yesterdayData.collectors),
    };
  }, [todayRevenue, todayOrders.length, activeCollectors, yesterdayData]);

  // Collectors who completed at least one order today
  const collectorStatusToday = useMemo(() => {
    const completedIds = new Set(
      todayOrders
        .filter((o) => o.status === 'completed')
        .map((o) => o.collector_id)
    );
    const activeIds = new Set(todayOrders.map((o) => o.collector_id));
    return collectors.map((c) => ({
      ...c,
      hasCompleted: completedIds.has(c.id),
      hasActivity: activeIds.has(c.id),
    }));
  }, [collectors, todayOrders]);

  // Pagination for recent orders
  const recentOrders = orders.slice(0, 50);
  const totalPages = Math.max(1, Math.ceil(recentOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedOrders = recentOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIdx = (safePage - 1) * PAGE_SIZE;

  // Greeting
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = format(now, 'EEEE, MMMM d, yyyy');
  const timeStr = format(now, 'h:mm a');

  if (error) {
    return (
      <div className="p-4 bg-[#f0f4f8] min-h-full">
        <div className="bg-white border border-[#e2ecf9] rounded-lg p-6 text-center">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button
            onClick={refetch}
            className="text-xs text-[#1a56db] hover:text-[#1447c0] font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#f0f4f8] min-h-full">
      {/* Welcome header */}
      <div className="mb-4">
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-[#0d1f35] leading-tight">
              {greeting}, Admin
            </h1>
            <p className="text-sm text-[#8aa0b8] mt-1">
              Here's what's happening today.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-[#0d1f35]">{dateStr}</p>
            <p className="text-xs text-[#8aa0b8]">{timeStr}</p>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#e2ecf9] rounded-lg p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <MetricCard
            title="Today Revenue"
            value={formatCurrency(todayRevenue)}
            sub="from completed orders"
            icon={TrendingUp}
            accent="bg-blue-50 text-blue-600"
            trend={trends.revenue}
          />
          <MetricCard
            title="Today Orders"
            value={todayOrders.length}
            sub="orders placed today"
            icon={ShoppingCart}
            accent="bg-indigo-50 text-indigo-600"
            trend={trends.orders}
          />
          <MetricCard
            title="Pending"
            value={pendingOrders.length}
            sub="awaiting confirmation"
            icon={Clock}
            accent="bg-amber-50 text-amber-600"
          />
          <MetricCard
            title="Active Collectors"
            value={activeCollectors}
            sub="active today"
            icon={Users}
            accent="bg-emerald-50 text-emerald-600"
            trend={trends.collectors}
          />
        </div>
      )}

      {/* Middle row: Status Donut + Collector Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        {/* Status Breakdown Donut */}
        <div className="bg-white border border-[#e2ecf9] rounded-lg p-5">
          <p className="text-sm font-semibold text-[#0d1f35] mb-4">Status Breakdown</p>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-[120px] h-[120px] rounded-full border-[14px] border-gray-200 animate-pulse" />
            </div>
          ) : (
            <StatusDonutChart orders={orders} />
          )}
        </div>

        {/* Collector Status Today */}
        <div className="bg-white border border-[#e2ecf9] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#0d1f35]">Collector Status Today</p>
            <p className="text-[11px] text-[#8aa0b8]">
              {collectorStatusToday.filter((c) => c.hasCompleted).length}/{collectorStatusToday.length} completed
            </p>
          </div>
          {collectorsLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : collectorStatusToday.length === 0 ? (
            <div className="text-center py-6">
              <Users size={20} className="mx-auto text-[#8aa0b8] mb-2" />
              <p className="text-xs text-[#8aa0b8]">No active collectors</p>
              <button
                onClick={() => navigate('/users')}
                className="mt-2 text-xs text-[#1a56db] hover:text-[#1447c0] font-medium"
              >
                Add collectors
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {collectorStatusToday.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#f8fafd] transition-colors"
                >
                  {c.hasCompleted ? (
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  ) : c.hasActivity ? (
                    <Clock size={16} className="text-amber-500 flex-shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-[#ccd9e8] flex-shrink-0" />
                  )}
                  <span className="text-sm text-[#0d1f35] flex-1 truncate">
                    {c.nickname || c.full_name}
                  </span>
                  <span
                    className={clsx('text-[11px] font-medium', {
                      'text-emerald-600': c.hasCompleted,
                      'text-amber-600': !c.hasCompleted && c.hasActivity,
                      'text-[#8aa0b8]': !c.hasActivity,
                    })}
                  >
                    {c.hasCompleted ? 'Completed' : c.hasActivity ? 'In progress' : 'No activity'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders (bottom, full width) */}
      <div className="bg-white border border-[#e2ecf9] rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2ecf9]">
          <p className="text-sm font-semibold text-[#0d1f35]">Recent Orders</p>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-1 text-xs text-[#1a56db] hover:text-[#1447c0] font-medium"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded flex-1" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-10 h-10 rounded-full bg-[#f0f4f8] flex items-center justify-center mx-auto mb-3">
              <ShoppingCart size={18} className="text-[#8aa0b8]" />
            </div>
            <p className="text-sm font-medium text-[#0d1f35] mb-1">No orders yet</p>
            <p className="text-xs text-[#8aa0b8] mb-4">
              Orders will appear here as collectors submit them from the mobile app.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => navigate('/orders')}
                className="px-3 py-1.5 text-xs font-medium text-[#1a56db] bg-[#e2ecf9] rounded-lg hover:bg-[#d0dff2] transition-colors"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate('/products')}
                className="px-3 py-1.5 text-xs font-medium text-[#4b5e73] bg-[#f0f4f8] rounded-lg hover:bg-[#e2ecf9] transition-colors"
              >
                View Products
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2ecf9]">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#8aa0b8] uppercase tracking-wide">Order #</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#8aa0b8] uppercase tracking-wide hidden sm:table-cell">Store</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#8aa0b8] uppercase tracking-wide hidden md:table-cell">Collector</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[#8aa0b8] uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#8aa0b8] uppercase tracking-wide">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[#8aa0b8] uppercase tracking-wide hidden lg:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[#f0f4f8] hover:bg-[#f8fafd] cursor-pointer transition-colors"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="px-4 py-2.5 text-sm font-mono text-[#0d1f35] font-medium">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-[#4b5e73] hidden sm:table-cell truncate max-w-[180px]">
                        {order.stores?.name || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-[#4b5e73] hidden md:table-cell truncate max-w-[160px]">
                        {order.profiles?.nickname || order.profiles?.full_name || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-semibold text-[#0d1f35] text-right tabular-nums">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded text-[11px] font-medium capitalize',
                            statusBadge[order.status]
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#8aa0b8] text-right hidden lg:table-cell tabular-nums">
                        {format(new Date(order.created_at), 'MMM d, HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="px-4 py-2.5 border-t border-[#e2ecf9] bg-[#f8fafd] flex justify-between items-center">
              <p className="text-[11px] text-[#8aa0b8]">
                Showing {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, recentOrders.length)} of {recentOrders.length}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={safePage === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="text-[11px] px-2.5 py-0.5 rounded border border-[#e2ecf9] text-[#4b5e73] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  <span className="text-[11px] text-[#4b5e73]">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    disabled={safePage === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="text-[11px] px-2.5 py-0.5 rounded border border-[#e2ecf9] text-[#4b5e73] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
