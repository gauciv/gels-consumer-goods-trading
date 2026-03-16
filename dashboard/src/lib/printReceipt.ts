/**
 * Prints a receipt by rendering it into a hidden iframe.
 * Uses Business Card size (55mm x 85mm) by default
 * with proper page break handling for long item lists.
 */
export function printReceiptElement(receiptEl: HTMLElement) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '55mm';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
<style>
  @page {
    size: 55mm 85mm;
    margin: 2mm;
  }
  html, body {
    width: 55mm;
    margin: 0;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  * {
    box-sizing: border-box;
  }
  table {
    display: table !important;
    page-break-inside: auto !important;
  }
  thead {
    display: table-header-group !important;
  }
  tbody {
    display: table-row-group !important;
  }
  tr {
    display: table-row !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  th, td {
    display: table-cell !important;
  }
  .receipt-section {
    page-break-inside: avoid;
    break-inside: avoid;
  }
</style>
</head>
<body>
${receiptEl.outerHTML}
</body>
</html>`);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 100);
  };
}
