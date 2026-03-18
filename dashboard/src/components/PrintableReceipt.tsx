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
    textAlign: 'left' as const,
    marginBottom: '1px',
  },
  addressLine: {
    fontSize: '7px',
    textAlign: 'left' as const,
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
    border: '1px solid #000',
  },
  thLeft: {
    textAlign: 'left' as const,
    fontWeight: 'bold' as const,
    padding: '2px',
    border: '1px solid #000',
  },
  thCenter: {
    textAlign: 'center' as const,
    fontWeight: 'bold' as const,
    padding: '2px',
    border: '1px solid #000',
  },
  thRight: {
    textAlign: 'right' as const,
    fontWeight: 'bold' as const,
    padding: '2px',
    border: '1px solid #000',
  },
  tableHeaderRow: {
    border: '1px solid #000',
  },
  tdLeft: {
    textAlign: 'left' as const,
    padding: '2px',
    verticalAlign: 'top' as const,
    border: '1px solid #000',
  },
  tdCenter: {
    textAlign: 'center' as const,
    padding: '2px',
    verticalAlign: 'top' as const,
    whiteSpace: 'nowrap' as const,
    border: '1px solid #000',
  },
  tdRight: {
    textAlign: 'right' as const,
    padding: '2px',
    verticalAlign: 'top' as const,
    whiteSpace: 'nowrap' as const,
    border: '1px solid #000',
  },
  totalRow: {
    textAlign: 'right' as const,
    fontSize: '9px',
    fontWeight: 'bold' as const,
    marginTop: '6px',
    paddingTop: '3px',
  },
  signatureSection: {
    marginTop: '12px',
    fontSize: '7px',
  },
  signatureText: {
    fontSize: '7px',
    marginBottom: '8px',
    lineHeight: 1.3,
    textAlign: 'right' as const,
  },
  signatureLines: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '16px',
    marginTop: '8px',
  },
  signatureBox: {
    textAlign: 'center' as const,
  },
  signatureLine: {
    borderBottom: '1px solid #000',
    width: '80px',
    marginBottom: '2px',
    minHeight: '20px',
  },
  signatureLabel: {
    fontSize: '6px',
    textAlign: 'center' as const,
  },
} as const;

export function PrintableReceipt({ order, companyOverride }: PrintableReceiptProps) {
  const { profile } = useCompanyProfile();

  const co = companyOverride || {};
  const companyName = co.company_name ?? profile?.company_name ?? 'Gels consumer goods trading';
  const address = co.address ?? profile?.address ?? 'Purok Tambis, Curvada\nSan Remigio Cebu, PhIlippines, 6011';
  const phone = co.contact_phone ?? profile?.contact_phone ?? 'Tel.(032)3167836/0936-9445027';

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
      <div className="receipt-section" style={{ textAlign: 'left', marginBottom: '3px' }}>
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

      {/* Signature Section */}
      <div style={s.signatureSection}>
        <div style={s.signatureText}>
          Received the above goods and services<br />in good order and condition
        </div>
        <div style={{ marginTop: '8px', fontSize: '7px', textAlign: 'left' }}>By:</div>
        <div style={s.signatureLines}>
          <div style={s.signatureBox}>
            <div style={s.signatureLine}></div>
            <div style={s.signatureLabel}>Authorized Signature</div>
          </div>
          <div style={s.signatureBox}>
            <div style={s.signatureLine}></div>
            <div style={s.signatureLabel}>Costumer Signature over printed name</div>
          </div>
        </div>
      </div>
    </div>
  );
}
