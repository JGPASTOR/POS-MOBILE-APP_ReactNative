import { formatCurrency } from './formatters';

export const generateCustomerReceipt = (sale) => {
  const receiptHtml = `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center;">Sales Receipt</h1>
        <p>Date: ${new Date(sale.date).toLocaleString()}</p>
        <p>Receipt No: ${sale.id}</p>
        <p>Payment Method: ${sale.paymentMethod.toUpperCase()}</p>
        <hr/>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <th style="text-align: left; padding: 8px;">Item</th>
            <th style="text-align: center; padding: 8px;">Qty</th>
            <th style="text-align: right; padding: 8px;">Price</th>
            <th style="text-align: right; padding: 8px;">Total</th>
          </tr>
          ${sale.items.map(item => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px;">${item.name}</td>
              <td style="text-align: center; padding: 8px;">${item.quantity}</td>
              <td style="text-align: right; padding: 8px;">₱${item.price.toFixed(2)}</td>
              <td style="text-align: right; padding: 8px;">₱${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        <div style="margin-top: 20px; text-align: right;">
          <p style="margin: 5px 0;">Subtotal: ₱${sale.subtotal.toFixed(2)}</p>
          <p style="margin: 5px 0;">Tax (12%): ₱${sale.tax.toFixed(2)}</p>
          <p style="margin: 5px 0; font-weight: bold;">Total: ₱${sale.total.toFixed(2)}</p>
          <p style="margin: 5px 0;">Amount Paid: ₱${sale.paid.toFixed(2)}</p>
          <p style="margin: 5px 0;">Change: ₱${sale.change.toFixed(2)}</p>
        </div>
        <p style="text-align: center; margin-top: 30px;">Thank you for your purchase!</p>
      </body>
    </html>
  `;
  return receiptHtml;
};

export default {
  generateCustomerReceipt
}; 