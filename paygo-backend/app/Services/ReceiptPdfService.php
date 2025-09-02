<?php

namespace App\Services;

use App\Models\PaymentReceipt;
use TCPDF;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ReceiptPdfService
{
    private $pdf;

    public function __construct()
    {
        // Create new PDF document
        $this->pdf = new TCPDF();
        
        // Set document information
        $this->pdf->SetCreator('KOYO PayGo System');
        $this->pdf->SetAuthor('KOYO PayGo');
        $this->pdf->SetTitle('Payment Receipt');
        
        // Remove default header/footer
        $this->pdf->setPrintHeader(false);
        $this->pdf->setPrintFooter(false);
        
        // Set margins
        $this->pdf->SetMargins(15, 15, 15);
        $this->pdf->SetAutoPageBreak(true, 15);
    }

    /**
     * Generate PDF receipt for a payment receipt
     */
    public function generateReceiptPdf(PaymentReceipt $receipt)
    {
        try {
            // Add a page
            $this->pdf->AddPage();
            
            // Set font
            $this->pdf->SetFont('helvetica', '', 10);
            
            // Generate PDF content
            $this->addHeader();
            $this->addReceiptHeader($receipt);
            $this->addCustomerInfo($receipt);
            $this->addPaymentDetails($receipt);
            $this->addFooter($receipt);
            
            // Generate PDF output
            $pdfContent = $this->pdf->Output('', 'S');
            
            return [
                'success' => true,
                'pdf_content' => $pdfContent,
                'filename' => "receipt_{$receipt->receipt_number}.pdf"
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to generate PDF: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Add company header
     */
    private function addHeader()
    {
        // Company logo area (placeholder)
        $this->pdf->SetFillColor(34, 197, 94); // Green background
        $this->pdf->Rect(15, 15, 180, 25, 'F');
        
        // Company name
        $this->pdf->SetTextColor(255, 255, 255);
        $this->pdf->SetFont('helvetica', 'B', 20);
        $this->pdf->SetXY(20, 22);
        $this->pdf->Cell(0, 10, 'KOYO PayGo', 0, 1, 'L');
        
        // Company tagline
        $this->pdf->SetFont('helvetica', '', 10);
        $this->pdf->SetXY(20, 32);
        $this->pdf->Cell(0, 6, 'Smart Payment Solutions for Smart Appliances', 0, 1, 'L');
        
        // Reset text color
        $this->pdf->SetTextColor(0, 0, 0);
        
        // Add some space
        $this->pdf->SetY(50);
    }

    /**
     * Add receipt header information
     */
    private function addReceiptHeader(PaymentReceipt $receipt)
    {
        $y = $this->pdf->GetY();
        
        // Receipt title
        $this->pdf->SetFont('helvetica', 'B', 16);
        $this->pdf->Cell(0, 10, 'PAYMENT RECEIPT', 0, 1, 'C');
        
        $this->pdf->Ln(5);
        
        // Receipt number and date in two columns
        $this->pdf->SetFont('helvetica', 'B', 12);
        
        // Left column - Receipt Number
        $this->pdf->SetXY(15, $this->pdf->GetY());
        $this->pdf->Cell(90, 8, 'Receipt Number:', 0, 0, 'L');
        $this->pdf->SetFont('helvetica', '', 11);
        $this->pdf->Cell(0, 8, $receipt->receipt_number, 0, 1, 'L');
        
        // Right column - Date
        $this->pdf->SetXY(105, $this->pdf->GetY() - 8);
        $this->pdf->SetFont('helvetica', 'B', 12);
        $this->pdf->Cell(90, 8, 'Date Issued:', 0, 0, 'L');
        $this->pdf->SetFont('helvetica', '', 11);
        $this->pdf->Cell(0, 8, $receipt->payment_date->format('d M Y, H:i'), 0, 1, 'L');
        
        $this->pdf->Ln(5);
        
        // Horizontal line
        $this->pdf->Line(15, $this->pdf->GetY(), 195, $this->pdf->GetY());
        $this->pdf->Ln(10);
    }

    /**
     * Add customer information section
     */
    private function addCustomerInfo(PaymentReceipt $receipt)
    {
        $this->pdf->SetFont('helvetica', 'B', 12);
        $this->pdf->Cell(0, 8, 'CUSTOMER INFORMATION', 0, 1, 'L');
        $this->pdf->Ln(3);
        
        $this->pdf->SetFont('helvetica', '', 10);
        
        // Customer details in a bordered box
        $startY = $this->pdf->GetY();
        
        // Name
        $this->pdf->SetFont('helvetica', 'B', 10);
        $this->pdf->Cell(40, 6, 'Customer Name:', 0, 0, 'L');
        $this->pdf->SetFont('helvetica', '', 10);
        $this->pdf->Cell(0, 6, $receipt->customer_name, 0, 1, 'L');
        
        // Phone
        $this->pdf->SetFont('helvetica', 'B', 10);
        $this->pdf->Cell(40, 6, 'Phone Number:', 0, 0, 'L');
        $this->pdf->SetFont('helvetica', '', 10);
        $this->pdf->Cell(0, 6, $receipt->customer_phone, 0, 1, 'L');
        
        // Email
        $this->pdf->SetFont('helvetica', 'B', 10);
        $this->pdf->Cell(40, 6, 'Email Address:', 0, 0, 'L');
        $this->pdf->SetFont('helvetica', '', 10);
        $this->pdf->Cell(0, 6, $receipt->customer_email, 0, 1, 'L');
        
        // Draw border around customer info
        $endY = $this->pdf->GetY();
        $this->pdf->Rect(15, $startY, 180, $endY - $startY);
        
        $this->pdf->Ln(10);
    }

    /**
     * Add payment details section
     */
    private function addPaymentDetails(PaymentReceipt $receipt)
    {
        $this->pdf->SetFont('helvetica', 'B', 12);
        $this->pdf->Cell(0, 8, 'PAYMENT DETAILS', 0, 1, 'L');
        $this->pdf->Ln(3);
        
        // Payment details table
        $this->addPaymentTable($receipt);
        
        $this->pdf->Ln(10);
        
        // Transaction details
        $this->addTransactionDetails($receipt);
    }

    /**
     * Add payment table
     */
    private function addPaymentTable(PaymentReceipt $receipt)
    {
        // Table headers
        $this->pdf->SetFont('helvetica', 'B', 10);
        $this->pdf->SetFillColor(240, 240, 240);
        
        $this->pdf->Cell(100, 8, 'Description', 1, 0, 'L', true);
        $this->pdf->Cell(80, 8, 'Amount (KSh)', 1, 1, 'R', true);
        
        // Table content
        $this->pdf->SetFont('helvetica', '', 10);
        $this->pdf->SetFillColor(255, 255, 255);
        
        // Product/Service
        $this->pdf->Cell(100, 8, $receipt->product_name, 1, 0, 'L', true);
        $this->pdf->Cell(80, 8, number_format($receipt->payment_amount, 2), 1, 1, 'R', true);
        
        // Payment type
        $paymentTypeLabel = ucwords(str_replace('_', ' ', $receipt->payment_type));
        $this->pdf->Cell(100, 8, "Payment Type: {$paymentTypeLabel}", 1, 0, 'L', true);
        $this->pdf->Cell(80, 8, '', 1, 1, 'R', true);
        
        // Total row
        $this->pdf->SetFont('helvetica', 'B', 11);
        $this->pdf->SetFillColor(34, 197, 94);
        $this->pdf->SetTextColor(255, 255, 255);
        $this->pdf->Cell(100, 10, 'TOTAL PAID', 1, 0, 'L', true);
        $this->pdf->Cell(80, 10, 'KSh ' . number_format($receipt->payment_amount, 2), 1, 1, 'R', true);
        
        // Reset colors
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetFillColor(255, 255, 255);
    }

    /**
     * Add transaction details
     */
    private function addTransactionDetails(PaymentReceipt $receipt)
    {
        $this->pdf->SetFont('helvetica', 'B', 11);
        $this->pdf->Cell(0, 8, 'TRANSACTION DETAILS', 0, 1, 'L');
        $this->pdf->Ln(3);
        
        $this->pdf->SetFont('helvetica', '', 10);
        
        $startY = $this->pdf->GetY();
        
        // Transaction details in two columns
        // Left column
        $this->pdf->SetXY(15, $this->pdf->GetY());
        $this->pdf->SetFont('helvetica', 'B', 10);
        $this->pdf->Cell(50, 6, 'Payment Method:', 0, 0, 'L');
        $this->pdf->SetFont('helvetica', '', 10);
        $this->pdf->Cell(50, 6, $receipt->payment_method, 0, 1, 'L');
        
        $this->pdf->SetFont('helvetica', 'B', 10);
        $this->pdf->Cell(50, 6, 'M-Pesa Receipt:', 0, 0, 'L');
        $this->pdf->SetFont('helvetica', '', 10);
        $this->pdf->Cell(50, 6, $receipt->mpesa_receipt_number ?: 'N/A', 0, 1, 'L');
        
        // Right column
        $this->pdf->SetXY(105, $startY);
        $this->pdf->SetFont('helvetica', 'B', 10);
        $this->pdf->Cell(50, 6, 'Order Reference:', 0, 0, 'L');
        $this->pdf->SetFont('helvetica', '', 10);
        $this->pdf->Cell(0, 6, $receipt->order_reference, 0, 1, 'L');
        
        $this->pdf->SetXY(105, $this->pdf->GetY());
        $this->pdf->SetFont('helvetica', 'B', 10);
        $this->pdf->Cell(50, 6, 'Payment Date:', 0, 0, 'L');
        $this->pdf->SetFont('helvetica', '', 10);
        $this->pdf->Cell(0, 6, $receipt->payment_date->format('d M Y H:i:s'), 0, 1, 'L');
        
        // Draw border
        $endY = $this->pdf->GetY();
        $this->pdf->Rect(15, $startY, 180, $endY - $startY);
    }

    /**
     * Add footer
     */
    private function addFooter(PaymentReceipt $receipt)
    {
        $this->pdf->Ln(15);
        
        // Thank you message
        $this->pdf->SetFont('helvetica', 'B', 12);
        $this->pdf->Cell(0, 8, 'Thank you for choosing KOYO PayGo!', 0, 1, 'C');
        
        $this->pdf->Ln(5);
        
        // Footer information
        $this->pdf->SetFont('helvetica', '', 9);
        $this->pdf->Cell(0, 5, 'This is an electronic receipt generated by KOYO PayGo system.', 0, 1, 'C');
        $this->pdf->Cell(0, 5, 'For support, contact us at support@koyo.com or +254700000000', 0, 1, 'C');
        
        $this->pdf->Ln(3);
        
        // Receipt generation info
        $this->pdf->SetFont('helvetica', '', 8);
        $this->pdf->SetTextColor(128, 128, 128);
        $generatedTime = $receipt->generated_at ? $receipt->generated_at->format('d M Y H:i:s') : now()->format('d M Y H:i:s');
        $this->pdf->Cell(0, 4, "Generated on: {$generatedTime}", 0, 1, 'C');
        $this->pdf->Cell(0, 4, "Receipt Status: " . ucfirst($receipt->status), 0, 1, 'C');
        
        // QR Code placeholder (you can implement QR code generation if needed)
        $this->pdf->Ln(5);
        $this->pdf->SetTextColor(0, 0, 0);
        $this->pdf->SetFont('helvetica', '', 8);
        $this->pdf->Cell(0, 4, 'Verify receipt authenticity at: https://koyo.com/verify/' . $receipt->receipt_number, 0, 1, 'C');
    }

    /**
     * Save PDF to storage and return path
     */
    public function savePdfToStorage(PaymentReceipt $receipt)
    {
        try {
            $result = $this->generateReceiptPdf($receipt);
            
            if (!$result['success']) {
                return $result;
            }
            
            // Create receipts directory if it doesn't exist
            $directory = 'receipts/' . date('Y/m');
            Storage::disk('public')->makeDirectory($directory);
            
            // Save PDF file
            $filename = $result['filename'];
            $path = $directory . '/' . $filename;
            
            Storage::disk('public')->put($path, $result['pdf_content']);
            
            return [
                'success' => true,
                'path' => $path,
                'url' => Storage::disk('public')->url($path),
                'filename' => $filename
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to save PDF: ' . $e->getMessage()
            ];
        }
    }
} 