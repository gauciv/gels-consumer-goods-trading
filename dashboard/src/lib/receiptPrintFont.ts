import receiptMonoBoldUrl from '@/assets/fonts/DejaVuSansMono-Bold.ttf';
import receiptMonoRegularUrl from '@/assets/fonts/DejaVuSansMono-Regular.ttf';

const RECEIPT_FONT_NAME = 'ReceiptTTF';

const envRegularUrl = import.meta.env.VITE_RECEIPT_TTF_REGULAR_URL?.trim();
const envBoldUrl = import.meta.env.VITE_RECEIPT_TTF_BOLD_URL?.trim();

const receiptRegularFontUrl = envRegularUrl || receiptMonoRegularUrl;
const receiptBoldFontUrl = envBoldUrl || receiptMonoBoldUrl;

export const RECEIPT_FONT_FAMILY = `'${RECEIPT_FONT_NAME}', 'DejaVu Sans Mono', 'Courier New', monospace`;

export function getReceiptPrintFontCss() {
  return `
  @font-face {
    font-family: '${RECEIPT_FONT_NAME}';
    src: url('${receiptRegularFontUrl}') format('truetype');
    font-style: normal;
    font-weight: 400;
    font-display: block;
  }

  @font-face {
    font-family: '${RECEIPT_FONT_NAME}';
    src: url('${receiptBoldFontUrl}') format('truetype');
    font-style: normal;
    font-weight: 700;
    font-display: block;
  }
`;
}

export async function waitForReceiptFonts(fonts?: FontFaceSet) {
  if (!fonts) return;

  await Promise.allSettled([
    fonts.load(`400 8px "${RECEIPT_FONT_NAME}"`),
    fonts.load(`700 8px "${RECEIPT_FONT_NAME}"`),
    fonts.ready,
  ]);
}
