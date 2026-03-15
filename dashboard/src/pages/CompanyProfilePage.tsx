import { useState, useEffect, useMemo } from 'react';
import { Loader2, Save, Building2, FileText, Clock, Globe, MapPin, Phone, Mail, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { PrintableReceipt } from '@/components/PrintableReceipt';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';
import toast from 'react-hot-toast';

const inputCls =
  'w-full border border-[#1E3F5E]/60 rounded-md px-3 py-2 text-xs bg-[#0D1F33] text-[#E8EDF2] placeholder-[#8FAABE]/40 focus:outline-none focus:ring-2 focus:ring-[#5B9BD5] transition-colors';
const labelCls = 'block text-[10px] font-semibold text-[#8FAABE]/50 uppercase tracking-wider mb-1.5';

const MOCK_ORDER: Order = {
  id: 'preview',
  order_number: 'ORD-20260315-0001',
  collector_id: '',
  store_id: '',
  status: 'completed',
  subtotal: 2850,
  tax_amount: 0,
  total_amount: 2850,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  profiles: { full_name: 'Juan Dela Cruz', email: 'juan@example.com', nickname: 'Juan' },
  stores: { name: 'Sample Store', address: '123 Main St.' },
  order_items: [
    { id: '1', order_id: 'preview', product_id: 'p1', product_name: 'Product Alpha', quantity: 10, unit_price: 150, line_total: 1500, created_at: '' },
    { id: '2', order_id: 'preview', product_id: 'p2', product_name: 'Product Beta', quantity: 5, unit_price: 200, line_total: 1000, created_at: '' },
    { id: '3', order_id: 'preview', product_id: 'p3', product_name: 'Product Gamma', quantity: 7, unit_price: 50, line_total: 350, created_at: '' },
  ],
};

interface FormState {
  company_name: string;
  address: string;
  contact_phone: string;
  contact_email: string;
  receipt_footer: string;
  prepared_by: string;
  received_by: string;
}

type Tab = 'profile' | 'receipt';

interface CompanyStats {
  totalOrders: number;
  totalRevenue: number;
  activeStores: number;
  activeCollectors: number;
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#0D1F33] rounded-lg p-3 border border-[#1E3F5E]/30">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded bg-[#5B9BD5]/10 flex items-center justify-center">
          <Icon size={12} className="text-[#5B9BD5]" />
        </div>
        <span className="text-[10px] text-[#8FAABE]/50 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-bold text-[#E8EDF2] tabular-nums">{value}</p>
      {sub && <p className="text-[9px] text-[#8FAABE]/40 mt-0.5">{sub}</p>}
    </div>
  );
}

export function CompanyProfilePage() {
  const { profile, loading, error, updateProfile } = useCompanyProfile();
  const [form, setForm] = useState<FormState>({
    company_name: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    receipt_footer: '',
    prepared_by: '',
    received_by: '',
  });
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [stats, setStats] = useState<CompanyStats>({ totalOrders: 0, totalRevenue: 0, activeStores: 0, activeCollectors: 0 });

  useEffect(() => {
    if (profile && !initialized) {
      setForm({
        company_name: profile.company_name || '',
        address: profile.address || '',
        contact_phone: profile.contact_phone || '',
        contact_email: profile.contact_email || '',
        receipt_footer: profile.receipt_footer || '',
        prepared_by: profile.prepared_by || '',
        received_by: profile.received_by || '',
      });
      setInitialized(true);
    }
  }, [profile, initialized]);

  // Fetch company stats
  useEffect(() => {
    async function loadStats() {
      const [{ count: ordersCount }, { data: revenueData }, { count: storesCount }, { count: collectorsCount }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').in('status', ['pending', 'confirmed', 'processing', 'completed']),
        supabase.from('stores').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'collector').eq('is_active', true),
      ]);
      const totalRevenue = (revenueData || []).reduce((sum, o) => sum + ((o as { total_amount: number }).total_amount || 0), 0);
      setStats({
        totalOrders: ordersCount || 0,
        totalRevenue,
        activeStores: storesCount || 0,
        activeCollectors: collectorsCount || 0,
      });
    }
    loadStats();
  }, []);

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        company_name: form.company_name || null,
        address: form.address || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        receipt_footer: form.receipt_footer || null,
        prepared_by: form.prepared_by || null,
        received_by: form.received_by || null,
      });
      toast.success('Company profile saved');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      (form.company_name || '') !== (profile.company_name || '') ||
      (form.address || '') !== (profile.address || '') ||
      (form.contact_phone || '') !== (profile.contact_phone || '') ||
      (form.contact_email || '') !== (profile.contact_email || '') ||
      (form.receipt_footer || '') !== (profile.receipt_footer || '') ||
      (form.prepared_by || '') !== (profile.prepared_by || '') ||
      (form.received_by || '') !== (profile.received_by || '')
    );
  }, [form, profile]);

  if (loading) {
    return (
      <div className="p-3 bg-[#0D1F33] min-h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-[#5B9BD5]" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-[#0D1F33] min-h-full">
        <div className="bg-[#162F4D] border border-[#1E3F5E]/60 rounded-lg p-6 text-center">
          <p className="text-xs text-[#E06C75]">{error}</p>
        </div>
      </div>
    );
  }

  const companyOverride = {
    company_name: form.company_name || null,
    address: form.address || null,
    contact_phone: form.contact_phone || null,
    contact_email: form.contact_email || null,
    receipt_footer: form.receipt_footer || null,
    prepared_by: form.prepared_by || null,
    received_by: form.received_by || null,
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Company Profile', icon: Building2 },
    { key: 'receipt', label: 'Receipt Config', icon: FileText },
  ];

  return (
    <div className="p-3 bg-[#0D1F33] min-h-full">
      {/* Company Header Banner */}
      <div className="bg-[#162F4D] border border-[#1E3F5E]/60 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#5B9BD5]/10 flex items-center justify-center flex-shrink-0">
            <Building2 size={22} className="text-[#5B9BD5]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-[#E8EDF2]">{form.company_name || 'Your Company'}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              {form.address && (
                <span className="flex items-center gap-1 text-[10px] text-[#8FAABE]/60">
                  <MapPin size={10} />
                  {form.address}
                </span>
              )}
              {form.contact_phone && (
                <span className="flex items-center gap-1 text-[10px] text-[#8FAABE]/60">
                  <Phone size={10} />
                  {form.contact_phone}
                </span>
              )}
              {form.contact_email && (
                <span className="flex items-center gap-1 text-[10px] text-[#8FAABE]/60">
                  <Mail size={10} />
                  {form.contact_email}
                </span>
              )}
            </div>
          </div>
          {profile?.updated_at && (
            <div className="text-right flex-shrink-0">
              <p className="text-[9px] text-[#8FAABE]/35">Last updated</p>
              <p className="text-[10px] text-[#8FAABE]/50">{new Date(profile.updated_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats.totalOrders.toLocaleString()} sub="all time" />
        <StatCard icon={TrendingUp} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} sub="all time" />
        <StatCard icon={MapPin} label="Active Stores" value={stats.activeStores} sub="registered stores" />
        <StatCard icon={Users} label="Active Collectors" value={stats.activeCollectors} sub="field team" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 bg-[#162F4D] border border-[#1E3F5E]/60 rounded-lg p-1 max-w-md">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex-1 justify-center',
              activeTab === t.key
                ? 'bg-[#5B9BD5] text-white'
                : 'text-[#8FAABE]/60 hover:text-[#E8EDF2] hover:bg-[#1A3755]'
            )}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid lg:grid-cols-2 gap-4 max-w-4xl">
          {/* Business Information */}
          <div className="bg-[#162F4D] border border-[#1E3F5E]/60 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={14} className="text-[#5B9BD5]" />
              <p className="text-xs font-semibold text-[#E8EDF2]">Business Information</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Company Name</label>
                <input className={inputCls} value={form.company_name} onChange={(e) => handleChange('company_name', e.target.value)} placeholder="Enter company name" />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input className={inputCls} value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Enter company address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Contact Phone</label>
                  <input className={inputCls} value={form.contact_phone} onChange={(e) => handleChange('contact_phone', e.target.value)} placeholder="Phone number" />
                </div>
                <div>
                  <label className={labelCls}>Contact Email</label>
                  <input className={inputCls} value={form.contact_email} onChange={(e) => handleChange('contact_email', e.target.value)} placeholder="Email address" />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="mt-4 w-full bg-[#5B9BD5] text-white text-xs py-2 rounded-md hover:bg-[#4A8BC4] flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
              {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
            </button>
          </div>

          {/* Business Overview */}
          <div className="space-y-4">
            {/* Business Hours Info */}
            <div className="bg-[#162F4D] border border-[#1E3F5E]/60 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-[#5B9BD5]" />
                <p className="text-xs font-semibold text-[#E8EDF2]">Quick Reference</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5 border-b border-[#1E3F5E]/30">
                  <span className="text-[10px] text-[#8FAABE]/60">Platform</span>
                  <span className="text-[10px] text-[#E8EDF2]">POS Dashboard</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#1E3F5E]/30">
                  <span className="text-[10px] text-[#8FAABE]/60">Active Products</span>
                  <span className="text-[10px] text-[#E8EDF2]">—</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#1E3F5E]/30">
                  <span className="text-[10px] text-[#8FAABE]/60">Total Stores</span>
                  <span className="text-[10px] text-[#E8EDF2]">{stats.activeStores}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[10px] text-[#8FAABE]/60">Field Team Size</span>
                  <span className="text-[10px] text-[#E8EDF2]">{stats.activeCollectors}</span>
                </div>
              </div>
            </div>

            {/* Company Identity Card */}
            <div className="bg-[#162F4D] border border-[#1E3F5E]/60 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={14} className="text-[#5B9BD5]" />
                <p className="text-xs font-semibold text-[#E8EDF2]">Company Identity</p>
              </div>
              <div className="bg-[#0D1F33] rounded-lg p-4 border border-[#1E3F5E]/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5B9BD5]/10 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-[#5B9BD5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#E8EDF2] truncate">{form.company_name || 'Not Set'}</p>
                    <p className="text-[10px] text-[#8FAABE]/50 truncate">{form.address || 'No address configured'}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#1E3F5E]/30 grid grid-cols-2 gap-2">
                  <div className="text-[10px]">
                    <span className="text-[#8FAABE]/40 block">Phone</span>
                    <span className="text-[#E8EDF2]">{form.contact_phone || '—'}</span>
                  </div>
                  <div className="text-[10px]">
                    <span className="text-[#8FAABE]/40 block">Email</span>
                    <span className="text-[#E8EDF2] truncate block">{form.contact_email || '—'}</span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-[#8FAABE]/30 mt-2 text-center">
                This information appears on receipts and reports
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'receipt' && (
        <div className="flex flex-col lg:flex-row gap-4 max-w-4xl">
          {/* Receipt Configuration Form */}
          <div className="flex-1 max-w-md">
            <div className="bg-[#162F4D] border border-[#1E3F5E]/60 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={14} className="text-[#5B9BD5]" />
                <p className="text-xs font-semibold text-[#E8EDF2]">Receipt Configuration</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Receipt Footer / Terms</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={4}
                    value={form.receipt_footer}
                    onChange={(e) => handleChange('receipt_footer', e.target.value)}
                    placeholder="Enter receipt footer text, terms & conditions, or return policy"
                  />
                  <p className="text-[9px] text-[#8FAABE]/30 mt-1">Displayed at the bottom of every receipt</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Prepared By Label</label>
                    <input className={inputCls} value={form.prepared_by} onChange={(e) => handleChange('prepared_by', e.target.value)} placeholder="Prepared By" />
                  </div>
                  <div>
                    <label className={labelCls}>Received By Label</label>
                    <input className={inputCls} value={form.received_by} onChange={(e) => handleChange('received_by', e.target.value)} placeholder="Received By" />
                  </div>
                </div>
                <div className="bg-[#0D1F33] rounded-lg p-3 border border-[#1E3F5E]/30">
                  <p className="text-[10px] font-medium text-[#8FAABE]/60 mb-2">Receipt includes from Company Profile:</p>
                  <ul className="space-y-1">
                    {[
                      { label: 'Company Name', value: form.company_name },
                      { label: 'Address', value: form.address },
                      { label: 'Phone', value: form.contact_phone },
                      { label: 'Email', value: form.contact_email },
                    ].map((item) => (
                      <li key={item.label} className="flex items-center justify-between text-[10px]">
                        <span className="text-[#8FAABE]/50">{item.label}</span>
                        <span className={item.value ? 'text-[#98C379]' : 'text-[#E06C75]/60'}>
                          {item.value ? 'Configured' : 'Not set'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="mt-4 w-full bg-[#5B9BD5] text-white text-xs py-2 rounded-md hover:bg-[#4A8BC4] flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
                {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
              </button>
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="lg:w-[340px] flex-shrink-0">
            <p className="text-[10px] font-semibold text-[#8FAABE]/50 uppercase tracking-wider mb-2 text-center">
              Live Receipt Preview
            </p>
            <div className="bg-white rounded-lg shadow-lg border border-[#1E3F5E]/20 overflow-hidden">
              <PrintableReceipt order={MOCK_ORDER} companyOverride={companyOverride} />
            </div>
            <p className="text-[10px] text-[#8FAABE]/30 mt-2 text-center">
              Updates in real time as you edit
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
