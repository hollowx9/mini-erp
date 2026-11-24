import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateInvoicePdf(order) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("Mini ERP - Invoice", 14, 20);

  doc.setFontSize(11);
  doc.text(`Invoice #: ${order.id}`, 14, 32);
  doc.text(`Customer: ${order.customerName}`, 14, 40);
  doc.text(`Email: ${order.customerEmail}`, 14, 48);
  doc.text(`Phone: ${order.customerPhone}`, 14, 56);
  doc.text(`Status: ${order.status}`, 14, 64);

  autoTable(doc, {
    startY: 75,
    head: [["Product", "SKU", "Qty", "Unit Price", "Subtotal"]],
    body: order.items.map((item) => [
      item.productName,
      item.sku,
      item.quantity,
      `$${Number(item.unitPrice).toFixed(2)}`,
      `$${Number(item.subtotal).toFixed(2)}`,
    ]),
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(14);
  doc.text(`Total: $${Number(order.totalAmount).toFixed(2)}`, 14, finalY);

  doc.save(`invoice-order-${order.id}.pdf`);
}