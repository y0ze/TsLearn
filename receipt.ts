import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { OrderSchema, type Order } from "./order.schema.ts";

const OUTPUT_PATH = join(tmpdir(), "receipt.jpg");

// --- Read and validate the order ---

const jsonContent = readFileSync("./order.json", "utf-8");
const parsedJson: unknown = JSON.parse(jsonContent);
const order: Order = OrderSchema.parse(parsedJson);

// --- Build the receipt as an HTML string ---

function money(amount: number): string {
  return amount.toFixed(2);
}

function buildReceiptHtml(order: Order): string {
  const rows = order.products
    .map(
      (p) => `
        <tr>
          <td>${p.name}</td>
          <td class="num">${p.quantity}</td>
          <td class="num">${money(p.unitPrice)}</td>
          <td class="num">${money(p.quantity * p.unitPrice)}</td>
        </tr>`
    )
    .join("");

  const total = order.products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body {
    font-family: "Courier New", monospace;
    width: 380px;
    margin: 0;
    padding: 24px;
    background: #ffffff;
    color: #111111;
  }
  h1 {
    font-size: 18px;
    text-align: center;
    margin: 0 0 4px 0;
    letter-spacing: 2px;
  }
  .sub {
    text-align: center;
    font-size: 11px;
    color: #555555;
    margin-bottom: 16px;
  }
  .divider {
    border-top: 1px dashed #999999;
    margin: 12px 0;
  }
  .meta {
    font-size: 12px;
    margin-bottom: 4px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-top: 8px;
  }
  th {
    text-align: left;
    font-size: 11px;
    border-bottom: 1px solid #111111;
    padding-bottom: 4px;
  }
  td {
    padding: 4px 0;
    vertical-align: top;
  }
  .num {
    text-align: right;
  }
  .total-row td {
    border-top: 1px solid #111111;
    font-weight: bold;
    padding-top: 8px;
  }
  .footer {
    text-align: center;
    font-size: 11px;
    color: #555555;
    margin-top: 20px;
  }
</style>
</head>
<body>
  <h1>RECEIPT</h1>
  <div class="sub">Thank you for your order</div>
  <div class="divider"></div>
  <div class="meta"><strong>Customer:</strong> ${order.name}</div>
  <div class="meta"><strong>Deliver to:</strong> ${order.delivery.street} ${order.delivery.number}, ${order.delivery.city}, ${order.delivery.postalCode}</div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="num">Qty</th>
        <th class="num">Price</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="3">TOTAL</td>
        <td class="num">${money(total)}</td>
      </tr>
    </tbody>
  </table>
  <div class="footer">--- Generated receipt ---</div>
</body>
</html>`;
}

// --- Render the HTML to a JPG using a headless browser ---

async function renderReceiptJpg(html: string, outputPath: string): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 420, height: 100 } });
  await page.setContent(html, { waitUntil: "networkidle" });
  // Crop tightly to the receipt's own bounding box instead of the full viewport/page.
  await page.locator("body").screenshot({ path: outputPath, type: "jpeg", quality: 95 });
  await browser.close();
}

const html = buildReceiptHtml(order);
await renderReceiptJpg(html, OUTPUT_PATH);

console.log(`Wrote ${OUTPUT_PATH}`);
