import type { Order } from '@/types';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';

interface CompanyOverride {
  company_name?: string | null;
  address?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
}

interface PrintableReceiptProps {
  order: Order;
  companyOverride?: CompanyOverride;
}

const s = {
  root: {
    fontFamily: "'Courier New', Courier, monospace",
    padding: '6px 8px',
    maxWidth: '58mm',
    margin: '0 auto',
    color: '#000',
    fontSize: '8px',
    lineHeight: 1.25,
  },
  center: { textAlign: 'center' as const },
  bold: { fontWeight: 'bold' as const },
  companyName: {
    fontSize: '9px',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    marginBottom: '1px',
  },
  addressLine: {
    fontSize: '7px',
    textAlign: 'center' as const,
    lineHeight: 1.3,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '8px',
    marginTop: '6px',
    marginBottom: '2px',
  },
  receiptLabel: { fontWeight: 'bold' as const },
  receiptNumber: { fontWeight: 'bold' as const },
  dateRow: {
    textAlign: 'right' as const,
    fontSize: '8px',
    marginBottom: '4px',
  },
  infoRow: {
    fontSize: '8px',
    marginBottom: '1px',
  },
  infoLabel: { fontWeight: 'normal' as const },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '7.5px',
    marginTop: '3px',
  },
  thLeft: {
    textAlign: 'left' as const,
    fontWeight: 'bold' as const,
    paddingBottom: '2px',
    paddingRight: '2px',
  },
  thCenter: {
    textAlign: 'center' as const,
    fontWeight: 'bold' as const,
    paddingBottom: '2px',
    paddingLeft: '2px',
    paddingRight: '2px',
  },
  thRight: {
    textAlign: 'right' as const,
    fontWeight: 'bold' as const,
    paddingBottom: '2px',
    paddingLeft: '2px',
  },
  tableHeaderRow: {
    borderBottom: '1px solid #000',
  },
  tdLeft: {
    textAlign: 'left' as const,
    paddingTop: '2px',
    paddingBottom: '2px',
    paddingRight: '2px',
    verticalAlign: 'top' as const,
  },
  tdCenter: {
    textAlign: 'center' as const,
    paddingTop: '2px',
    paddingBottom: '2px',
    paddingLeft: '2px',
    paddingRight: '2px',
    verticalAlign: 'top' as const,
    whiteSpace: 'nowrap' as const,
  },
  tdRight: {
    textAlign: 'right' as const,
    paddingTop: '2px',
    paddingBottom: '2px',
    paddingLeft: '2px',
    verticalAlign: 'top' as const,
    whiteSpace: 'nowrap' as const,
  },
  totalRow: {
    textAlign: 'right' as const,
    fontSize: '9px',
    fontWeight: 'bold' as const,
    marginTop: '6px',
    paddingTop: '3px',
  },
} as const;

export function PrintableReceipt({ order, companyOverride }: PrintableReceiptProps) {
  const { profile } = useCompanyProfile();

  const co = companyOverride || {};
  const companyName = co.company_name ?? profile?.company_name ?? "GEL'S CONSUMER GOODS TRADING";
  const address = co.address ?? profile?.address ?? 'Purok Tambis, Curvada\nSan Remigio, Cebu, Philippines 6011';
  const phone = co.contact_phone ?? profile?.contact_phone ?? 'TEL (032) 167815 / 0936 3446597';

  // Format date as MM/DD/YYYY
  const formatReceiptDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Format quantity - simple number
  const formatQuantity = (qty: number) => {
    return qty.toString();
  };

  // Format currency without currency symbol, just comma separator
  const formatPrice = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div id="printable-receipt" style={s.root}>
      {/* Header - Company Info */}
      <div className="receipt-section" style={{ textAlign: 'center', marginBottom: '3px' }}>
        <div style={s.companyName}>{companyName}</div>
        {address.split('\n').map((line, i) => (
          <div key={i} style={s.addressLine}>
            {line}
          </div>
        ))}
        {phone && <div style={s.addressLine}>{phone}</div>}
      </div>

      {/* Receipt Type and Number */}
      <div style={s.headerRow}>
        <span style={s.receiptLabel}>DELIVERY RECEIPT</span>
        <span style={s.receiptNumber}>{order.order_number}</span>
      </div>

      {/* Date */}
      <div style={s.dateRow}>Date: {formatReceiptDate(order.created_at)}</div>

      {/* Delivery Info */}
      <div style={s.infoRow}>
        <span style={s.infoLabel}>Delivered to: </span>
        {order.stores?.name || '_________________'}
      </div>
      <div style={s.infoRow}>
        <span style={s.infoLabel}>Address: </span>
        {order.stores?.address || '_________________'}
      </div>
      <div style={s.infoRow}>
        <span style={s.infoLabel}>TERMS: ________</span>
      </div>

      {/* Item Table */}
      <table style={s.table}>
        <thead>
          <tr style={s.tableHeaderRow}>
            <th style={s.thLeft}>Description</th>
            <th style={s.thCenter}>Qty</th>
            <th style={s.thRight}>Price</th>
            <th style={s.thRight}>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items?.map((item) => (
            <tr key={item.id}>
              <td style={s.tdLeft}>{item.product_name}</td>
              <td style={s.tdCenter}>{formatQuantity(item.quantity)}</td>
              <td style={s.tdRight}>{formatPrice(item.unit_price)}</td>
              <td style={s.tdRight}>{formatPrice(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div style={s.totalRow}>Total = {formatPrice(order.total_amount)}</div>
    </div>
  );
}
