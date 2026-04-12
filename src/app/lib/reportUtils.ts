import { formatEther } from 'ethers';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { supabase } from './supabaseClient';

export interface Transaction {
  id: string;
  created_at: string;
  recipient_address: string;
  recipient_name?: string;
  amount: number | string;
  status: string;
  tx_hash?: string;
}

export interface Distribution {
  id: string;
  created_at: string;
  amount: number | string;
  status: string;
}

/**
 * Export transactions as CSV file
 */
export async function exportTransactionsCSV(
  fromDate: Date,
  toDate: Date
): Promise<void> {
  try {
    // Fetch transactions from Supabase for the date range
    const { data, error } = await supabase
      .from('distributions')
      .select('id, created_at, recipient_address, amount, status, tx_hash')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transactions = (data || []) as any[];

    // Create CSV
    const headers = ['Date', 'Recipient', 'Amount (ETH)', 'Status', 'Transaction Hash'];
    const rows = transactions.map((tx) => [
      new Date(tx.created_at).toISOString().split('T')[0],
      tx.recipient_address?.slice(0, 8) || 'Unknown',
      formatEthValue(tx.amount),
      tx.status || 'pending',
      tx.tx_hash || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const dateRange = formatDateRange(fromDate, toDate);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions-${dateRange}.csv`;
    link.click();

    toast.success('CSV exported successfully');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    toast.error('Failed to export CSV');
    throw error;
  }
}

/**
 * Export distribution report as PDF file
 */
export async function exportDistributionPDF(
  fromDate: Date,
  toDate: Date
): Promise<void> {
  try {
    // Fetch distributions for the date range
    const { data: distData, error: distError } = await supabase
      .from('distributions')
      .select('id, created_at, amount, status')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString());

    if (distError) throw distError;

    const distributions = (distData || []) as any[];

    // Calculate summary
    const totalAmount = distributions.reduce((sum: number, d: any) => {
      return sum + parseFloat(d.amount || 0);
    }, 0);

    const recipientCount = new Set(distributions.map((d: any) => d.recipient_address)).size;
    const distributionCount = distributions.length;

    // Create hidden div with PDF content
    const pdfContentDiv = document.createElement('div');
    pdfContentDiv.id = 'pdf-content-temp';
    pdfContentDiv.style.position = 'absolute';
    pdfContentDiv.style.left = '-9999px';
    pdfContentDiv.style.top = '-9999px';
    pdfContentDiv.style.width = '800px';
    pdfContentDiv.style.backgroundColor = '#ffffff';
    pdfContentDiv.style.padding = '40px';
    pdfContentDiv.style.fontFamily = 'Arial, sans-serif';
    pdfContentDiv.style.color = '#000000';

    // Build HTML content
    pdfContentDiv.innerHTML = `
      <div>
        <h1 style="margin: 0 0 20px 0; font-size: 32px;">Distribution Report</h1>
        <p style="margin: 0 0 30px 0; font-size: 14px; color: #666;">
          Date Range: ${formatDateDisplay(fromDate)} to ${formatDateDisplay(toDate)}
        </p>
        
        <h2 style="margin: 20px 0 15px 0; font-size: 20px;">Summary</h2>
        <table style="width: 100%; margin-bottom: 30px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Total Amount:</td>
            <td style="padding: 8px;">${formatEthValue(totalAmount)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Recipients:</td>
            <td style="padding: 8px;">${recipientCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Distributions:</td>
            <td style="padding: 8px;">${distributionCount}</td>
          </tr>
        </table>
        
        <h2 style="margin: 20px 0 15px 0; font-size: 20px;">Recipient Breakdown</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #ccc; padding: 12px; text-align: left; font-weight: bold;">Recipient</th>
              <th style="border: 1px solid #ccc; padding: 12px; text-align: center; font-weight: bold;">Amount (ETH)</th>
              <th style="border: 1px solid #ccc; padding: 12px; text-align: center; font-weight: bold;">% of Total</th>
            </tr>
          </thead>
          <tbody>
            ${distributions
              .reduce(
                (acc: any, d: any) => {
                  const recipient = d.recipient_address || 'Unknown';
                  const existing = acc.find((item: any) => item.recipient === recipient);
                  if (existing) {
                    existing.amount += parseFloat(d.amount || 0);
                  } else {
                    acc.push({ recipient, amount: parseFloat(d.amount || 0) });
                  }
                  return acc;
                },
                [] as any[]
              )
              .sort((a: any, b: any) => b.amount - a.amount)
              .map(
                (r: any) => `
                <tr>
                  <td style="border: 1px solid #ccc; padding: 12px;">${r.recipient.slice(0, 12)}...</td>
                  <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">${formatEthValue(r.amount)}</td>
                  <td style="border: 1px solid #ccc; padding: 12px; text-align: center;">${((r.amount / totalAmount) * 100).toFixed(1)}%</td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>
        
        <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #999;">
          Generated: ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    // Append to body temporarily
    document.body.appendChild(pdfContentDiv);

    // Convert to canvas
    const canvas = await html2canvas(pdfContentDiv, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    // Remove temp div
    document.body.removeChild(pdfContentDiv);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let remainingHeight = imgHeight;
    let position = 10;

    // Add images to PDF (handle multiple pages)
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);

    // Download PDF
    const dateRange = formatDateRange(fromDate, toDate);
    pdf.save(`distribution-report-${dateRange}.pdf`);

    toast.success('PDF exported successfully');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Failed to export PDF');
    throw error;
  }
}

/**
 * Format ETH value with proper decimals
 */
export function formatEthValue(value: string | number): string {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0 ETH';

    const formatted = parseFloat(num.toFixed(6));
    return `${formatted.toLocaleString()} ETH`;
  } catch (error) {
    console.error('Error formatting ETH value:', error);
    return '0 ETH';
  }
}

/**
 * Format date range for filenames
 */
export function formatDateRange(fromDate: Date, toDate: Date): string {
  const from = fromDate.toISOString().split('T')[0];
  const to = toDate.toISOString().split('T')[0];
  return `${from}-to-${to}`;
}

/**
 * Format date for display
 */
export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
