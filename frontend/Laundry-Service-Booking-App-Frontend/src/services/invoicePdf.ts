import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceItem {
  serviceName?: string;
  service?: { name?: string } | string;
  name?: string;
  quantity: number;
  price?: number;
  pricePerUnit?: number;
  subtotal: number;
}

interface InvoiceOrder {
  _id: string;
  orderId: string;
  user?: { name?: string; email?: string; phone?: string };
  billingInfo?: { fullName?: string; email?: string; phone?: string; address?: string };
  shippingInfo?: { fullName?: string; phone?: string; address?: string };
  items: InvoiceItem[];
  itemsSummary?: string;
  itemCount?: number;
  subtotal?: number;
  discount?: number;
  totalPayment: number;
  couponCode?: string;
  couponDiscount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  pickupCharge?: number;
  deliveryCharge?: number;
  deliverySpeedCharge?: number;
  deliveryType?: string;
  orderDate?: string;
  deliveryDate?: string;
  createdAt?: string;
  schedule?: { pickupDate?: string; deliveryDate?: string };
  status?: string;
}

const formatDate = (d: string | undefined) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const generateInvoicePDF = (order: InvoiceOrder, formatPriceFn?: (amount: number) => string) => {
  // Default format function if none provided: just show $ + amount
  const fp = formatPriceFn || ((amount: number) => `$${amount.toFixed(2)}`);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(15, 39, 68); // #0F2744
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Laundry Service', 14, 20);

  // Invoice label
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('INVOICE', 14, 30);

  // Invoice number and date - right aligned
  doc.setFontSize(10);
  doc.text(`Invoice #: ${order.orderId}`, pageWidth - 14, 20, { align: 'right' });
  doc.text(`Date: ${formatDate(order.orderDate || order.createdAt)}`, pageWidth - 14, 28, { align: 'right' });
  doc.text(`Status: ${(order.status || 'pending').replace(/_/g, ' ').toUpperCase()}`, pageWidth - 14, 36, { align: 'right' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Billing Info Section
  let y = 55;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 7;
  const customerName = order.billingInfo?.fullName || order.user?.name || 'Customer';
  doc.text(customerName, 14, y);
  y += 5;
  const customerEmail = order.billingInfo?.email || order.user?.email || '';
  if (customerEmail) { doc.text(customerEmail, 14, y); y += 5; }
  const customerPhone = order.billingInfo?.phone || order.user?.phone || '';
  if (customerPhone) { doc.text(`Phone: ${customerPhone}`, 14, y); y += 5; }
  const customerAddress = order.billingInfo?.address || order.shippingInfo?.address || '';
  if (customerAddress) { 
    const lines = doc.splitTextToSize(customerAddress, 80);
    doc.text(lines, 14, y); 
    y += lines.length * 5; 
  }

  // Payment & Delivery Info - right side
  let ry = 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Order Details:', pageWidth - 80, ry);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  ry += 7;
  if (order.paymentMethod) { doc.text(`Payment: ${order.paymentMethod.toUpperCase()}`, pageWidth - 80, ry); ry += 5; }
  if (order.paymentStatus) { doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, pageWidth - 80, ry); ry += 5; }
  if (order.deliveryType) { doc.text(`Delivery: ${order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1)}`, pageWidth - 80, ry); ry += 5; }
  if (order.deliveryDate || order.schedule?.deliveryDate) { 
    doc.text(`Est. Delivery: ${formatDate(order.deliveryDate || order.schedule?.deliveryDate)}`, pageWidth - 80, ry); 
    ry += 5; 
  }

  // Items table
  const tableY = Math.max(y, ry) + 10;

  // Prepare items data
  const itemRows = (order.items || []).map(item => {
    const name = item.serviceName || 
      (typeof item.service === 'object' && item.service?.name ? item.service.name : '') ||
      item.name || 'Service';
    const unitPrice = item.pricePerUnit || item.price || 0;
    const qty = item.quantity || 1;
    const sub = item.subtotal || (unitPrice * qty);
    return [name, String(qty), fp(unitPrice), fp(sub)];
  });

  if (itemRows.length === 0 && order.itemsSummary) {
    itemRows.push([order.itemsSummary, String(order.itemCount || 1), '-', fp(order.subtotal || order.totalPayment)]);
  }

  autoTable(doc, {
    startY: tableY,
    head: [['Service', 'Qty', 'Unit Price', 'Subtotal']],
    body: itemRows,
    theme: 'striped',
    headStyles: { 
      fillColor: [0, 191, 166], // #00BFA6
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
  });

  // Summary section
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable?.finalY || tableY + 50;
  finalY += 10;

  const summaryX = pageWidth - 80;
  const valueX = pageWidth - 14;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const subtotal = order.subtotal || order.items?.reduce((acc, i) => acc + (i.subtotal || 0), 0) || order.totalPayment;
  doc.text('Subtotal:', summaryX, finalY);
  doc.text(fp(subtotal), valueX, finalY, { align: 'right' });
  finalY += 6;

  if (order.discount && order.discount > 0) {
    doc.setTextColor(0, 128, 0);
    doc.text(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}:`, summaryX, finalY);
    doc.text(`-${fp(order.discount)}`, valueX, finalY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    finalY += 6;
  }

  if (order.pickupCharge && order.pickupCharge > 0) {
    doc.text('Pickup Charge:', summaryX, finalY);
    doc.text(fp(order.pickupCharge), valueX, finalY, { align: 'right' });
    finalY += 6;
  }

  if (order.deliveryCharge && order.deliveryCharge > 0) {
    doc.text('Delivery Charge:', summaryX, finalY);
    doc.text(fp(order.deliveryCharge), valueX, finalY, { align: 'right' });
    finalY += 6;
  }

  if (order.deliverySpeedCharge && order.deliverySpeedCharge > 0) {
    doc.text('Speed Charge:', summaryX, finalY);
    doc.text(fp(order.deliverySpeedCharge), valueX, finalY, { align: 'right' });
    finalY += 6;
  }

  // Total
  finalY += 2;
  doc.setDrawColor(0, 191, 166);
  doc.setLineWidth(0.5);
  doc.line(summaryX, finalY, valueX, finalY);
  finalY += 6;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 39, 68);
  doc.text('TOTAL:', summaryX, finalY);
  doc.text(fp(order.totalPayment), valueX, finalY, { align: 'right' });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFillColor(245, 247, 250);
  doc.rect(0, footerY - 5, pageWidth, 25, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for using our laundry service!', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, footerY + 5, { align: 'center' });

  // Save
  doc.save(`Invoice-${order.orderId}.pdf`);
};

export default generateInvoicePDF;
