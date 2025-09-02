<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentReceipt;
use App\Services\ReceiptService;
use App\Services\ReceiptPdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ReceiptController extends Controller
{
    private $receiptService;
    private $pdfService;

    public function __construct(ReceiptService $receiptService, ReceiptPdfService $pdfService)
    {
        $this->receiptService = $receiptService;
        $this->pdfService = $pdfService;
    }

    /**
     * Get receipts for the authenticated client
     * GET /api/client/receipts
     */
    public function getClientReceipts(Request $request)
    {
        try {
            // Get authenticated user
            $user = auth()->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => 'Authentication required'
                ], 401);
            }

            // Get pagination parameters
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 10);
            $sortBy = $request->query('sort_by', 'payment_date');
            $sortDirection = $request->query('sort_direction', 'desc');

            // Build query for client's receipts
            $query = PaymentReceipt::where(function ($q) use ($user) {
                $q->where('customer_email', $user->email)
                  ->orWhere('customer_phone', $user->phone);
            });

            // Apply sorting
            $allowedSortColumns = ['payment_date', 'payment_amount', 'created_at', 'status'];
            if (in_array($sortBy, $allowedSortColumns)) {
                $query->orderBy($sortBy, $sortDirection);
            } else {
                $query->orderBy('payment_date', 'desc');
            }

            // Get paginated results
            $receipts = $query->paginate($perPage, ['*'], 'page', $page);

            $formattedReceipts = $receipts->getCollection()->map(function ($receipt) {
                return [
                    'id' => $receipt->id,
                    'receipt_number' => $receipt->receipt_number,
                    'product_name' => $receipt->product_name,
                    'payment_amount' => $receipt->payment_amount,
                    'formatted_amount' => 'KSh ' . number_format($receipt->payment_amount, 2),
                    'payment_method' => $receipt->payment_method,
                    'mpesa_receipt_number' => $receipt->mpesa_receipt_number,
                    'payment_date' => $receipt->payment_date,
                    'payment_type' => $receipt->payment_type,
                    'plan_type' => $receipt->plan_type,
                    'order_reference' => $receipt->order_reference,
                    'status' => $receipt->status,
                    'generated_at' => $receipt->generated_at,
                    'viewed_at' => $receipt->viewed_at,
                    'downloaded_at' => $receipt->downloaded_at,
                    'created_at' => $receipt->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedReceipts,
                'pagination' => [
                    'current_page' => $receipts->currentPage(),
                    'per_page' => $receipts->perPage(),
                    'total' => $receipts->total(),
                    'last_page' => $receipts->lastPage(),
                    'from' => $receipts->firstItem(),
                    'to' => $receipts->lastItem(),
                ],
                'summary' => [
                    'total_receipts' => $receipts->total(),
                    'total_amount_paid' => $receipts->getCollection()->sum('payment_amount'),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Client receipts retrieval failed:', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve your receipts'
            ], 500);
        }
    }

    /**
     * Get all receipts for admin (with pagination and filtering)
     * GET /api/admin/receipts
     */
    public function getAllReceipts(Request $request)
    {
        try {
            $page = $request->query('page', 1);
            $perPage = $request->query('per_page', 15);
            $search = $request->query('search');
            $status = $request->query('status');
            $paymentType = $request->query('payment_type');
            $sortBy = $request->query('sort_by', 'created_at');
            $sortDirection = $request->query('sort_direction', 'desc');

            $query = PaymentReceipt::with(['paymentOrder', 'transaction']);

            // Search functionality
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('receipt_number', 'like', "%{$search}%")
                      ->orWhere('customer_name', 'like', "%{$search}%")
                      ->orWhere('customer_email', 'like', "%{$search}%")
                      ->orWhere('customer_phone', 'like', "%{$search}%")
                      ->orWhere('product_name', 'like', "%{$search}%")
                      ->orWhere('mpesa_receipt_number', 'like', "%{$search}%")
                      ->orWhere('order_reference', 'like', "%{$search}%");
                });
            }

            // Filter by status
            if ($status && $status !== 'all') {
                $query->where('status', $status);
            }

            // Filter by payment type
            if ($paymentType && $paymentType !== 'all') {
                $query->where('payment_type', $paymentType);
            }

            // Sorting
            $allowedSortColumns = ['created_at', 'payment_date', 'payment_amount', 'receipt_number', 'customer_name', 'status'];
            if (in_array($sortBy, $allowedSortColumns)) {
                $query->orderBy($sortBy, $sortDirection);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            $receipts = $query->paginate($perPage, ['*'], 'page', $page);

            $formattedReceipts = $receipts->getCollection()->map(function ($receipt) {
                return [
                    'id' => $receipt->id,
                    'receipt_number' => $receipt->receipt_number,
                    'customer_name' => $receipt->customer_name,
                    'customer_email' => $receipt->customer_email,
                    'customer_phone' => $receipt->customer_phone,
                    'product_name' => $receipt->product_name,
                    'payment_amount' => $receipt->payment_amount,
                    'formatted_amount' => 'KSh ' . number_format($receipt->payment_amount, 2),
                    'payment_method' => $receipt->payment_method,
                    'mpesa_receipt_number' => $receipt->mpesa_receipt_number,
                    'payment_date' => $receipt->payment_date,
                    'payment_type' => $receipt->payment_type,
                    'plan_type' => $receipt->plan_type,
                    'order_reference' => $receipt->order_reference,
                    'status' => $receipt->status,
                    'generated_at' => $receipt->generated_at,
                    'viewed_at' => $receipt->viewed_at,
                    'downloaded_at' => $receipt->downloaded_at,
                    'created_at' => $receipt->created_at,
                    'updated_at' => $receipt->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedReceipts,
                'pagination' => [
                    'current_page' => $receipts->currentPage(),
                    'per_page' => $receipts->perPage(),
                    'total' => $receipts->total(),
                    'last_page' => $receipts->lastPage(),
                    'from' => $receipts->firstItem(),
                    'to' => $receipts->lastItem(),
                ],
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'payment_type' => $paymentType,
                    'sort_by' => $sortBy,
                    'sort_direction' => $sortDirection,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get all receipts:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve receipts'
            ], 500);
        }
    }

    /**
     * Get receipt by receipt number (enhanced with status tracking)
     * GET /api/receipts/{receiptNumber}
     */
    public function getReceipt($receiptNumber)
    {
        try {
            // Validate receipt number format
            if (!preg_match('/^RCP-(\d{14})-[A-Z0-9]{4}$/', $receiptNumber)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid receipt number format'
                ], 400);
            }

            // Get receipt using service
            $result = $this->receiptService->getReceiptByNumber($receiptNumber);
            
            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'error' => $result['error']
                ], 404);
            }

            $receipt = $result['receipt'];
            
            // Mark as viewed if not already viewed
            $receipt->markAsViewed();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'receipt_number' => $receipt->receipt_number,
                    'receipt_content' => $receipt->receipt_data,
                    'customer_info' => [
                        'name' => $receipt->customer_name,
                        'email' => $receipt->customer_email,
                        'phone' => $receipt->customer_phone,
                    ],
                    'payment_details' => [
                        'amount' => $receipt->payment_amount,
                        'payment_date' => $receipt->payment_date,
                        'payment_method' => $receipt->payment_method,
                        'mpesa_receipt' => $receipt->mpesa_receipt_number,
                        'order_reference' => $receipt->order_reference,
                        'payment_type' => $receipt->payment_type,
                        'plan_type' => $receipt->plan_type,
                    ],
                    'product_info' => [
                        'name' => $receipt->product_name,
                    ],
                    'status' => $receipt->status,
                    'timestamps' => [
                        'generated_at' => $receipt->generated_at,
                        'sent_at' => $receipt->sent_at,
                        'viewed_at' => $receipt->viewed_at,
                        'downloaded_at' => $receipt->downloaded_at,
                        'created_at' => $receipt->created_at,
                        'updated_at' => $receipt->updated_at,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Receipt retrieval failed:', [
                'receipt_number' => $receiptNumber,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve receipt'
            ], 500);
        }
    }

    /**
     * Download receipt as PDF
     * GET /api/receipts/{receiptNumber}/download
     */
    public function downloadReceipt($receiptNumber)
    {
        try {
            // Get receipt data
            $result = $this->receiptService->getReceiptByNumber($receiptNumber);
            
            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'error' => $result['error']
                ], 404);
            }

            $receipt = $result['receipt'];
            
            // Generate PDF
            $pdfResult = $this->pdfService->generateReceiptPdf($receipt);
            
            if (!$pdfResult['success']) {
                return response()->json([
                    'success' => false,
                    'error' => $pdfResult['error']
                ], 500);
            }
            
            // Mark as downloaded
            $receipt->markAsDownloaded();

            // Return PDF as download
            return response($pdfResult['pdf_content'])
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $pdfResult['filename'] . '"')
                ->header('Content-Length', strlen($pdfResult['pdf_content']));

        } catch (\Exception $e) {
            Log::error('Receipt download failed:', [
                'receipt_number' => $receiptNumber,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to download receipt'
            ], 500);
        }
    }

    /**
     * Generate and preview PDF (for viewing without download)
     * GET /api/receipts/{receiptNumber}/preview
     */
    public function previewReceipt($receiptNumber)
    {
        try {
            // Get receipt data
            $result = $this->receiptService->getReceiptByNumber($receiptNumber);
            
            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'error' => $result['error']
                ], 404);
            }

            $receipt = $result['receipt'];
            
            // Generate PDF
            $pdfResult = $this->pdfService->generateReceiptPdf($receipt);
            
            if (!$pdfResult['success']) {
                return response()->json([
                    'success' => false,
                    'error' => $pdfResult['error']
                ], 500);
            }
            
            // Mark as viewed
            $receipt->markAsViewed();

            // Return PDF for inline viewing
            return response($pdfResult['pdf_content'])
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="' . $pdfResult['filename'] . '"');

        } catch (\Exception $e) {
            Log::error('Receipt preview failed:', [
                'receipt_number' => $receiptNumber,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to preview receipt'
            ], 500);
        }
    }

    /**
     * Update receipt status (admin only)
     * PUT /api/admin/receipts/{receiptNumber}/status
     */
    public function updateReceiptStatus(Request $request, $receiptNumber)
    {
        try {
            // Validate input
            $validator = Validator::make($request->all(), [
                'status' => 'required|string|in:generated,sent,viewed,downloaded',
                'notes' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            // Find receipt
            $receipt = PaymentReceipt::where('receipt_number', $receiptNumber)->first();
            
            if (!$receipt) {
                return response()->json([
                    'success' => false,
                    'error' => 'Receipt not found'
                ], 404);
            }

            $newStatus = $request->input('status');
            $notes = $request->input('notes');
            
            // Update status and corresponding timestamp
            $updates = ['status' => $newStatus];
            
            switch ($newStatus) {
                case 'sent':
                    if (!$receipt->sent_at) {
                        $updates['sent_at'] = now();
                    }
                    break;
                case 'viewed':
                    if (!$receipt->viewed_at) {
                        $updates['viewed_at'] = now();
                    }
                    break;
                case 'downloaded':
                    if (!$receipt->downloaded_at) {
                        $updates['downloaded_at'] = now();
                    }
                    break;
            }
            
            $receipt->update($updates);
            
            // Log the status update
            Log::info('Receipt status updated:', [
                'receipt_number' => $receiptNumber,
                'old_status' => $receipt->getOriginal('status'),
                'new_status' => $newStatus,
                'admin_notes' => $notes,
                'updated_by' => auth()->id() ?? 'system'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Receipt status updated successfully',
                'data' => [
                    'receipt_number' => $receipt->receipt_number,
                    'old_status' => $receipt->getOriginal('status'),
                    'new_status' => $receipt->status,
                    'updated_at' => $receipt->updated_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Receipt status update failed:', [
                'receipt_number' => $receiptNumber,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to update receipt status'
            ], 500);
        }
    }

    /**
     * Bulk update receipt statuses (admin only)
     * PUT /api/admin/receipts/bulk-status
     */
    public function bulkUpdateStatus(Request $request)
    {
        try {
            // Validate input
            $validator = Validator::make($request->all(), [
                'receipt_numbers' => 'required|array|min:1|max:50',
                'receipt_numbers.*' => 'required|string',
                'status' => 'required|string|in:generated,sent,viewed,downloaded',
                'notes' => 'nullable|string|max:500'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 422);
            }

            $receiptNumbers = $request->input('receipt_numbers');
            $newStatus = $request->input('status');
            $notes = $request->input('notes');
            
            // Find receipts
            $receipts = PaymentReceipt::whereIn('receipt_number', $receiptNumbers)->get();
            
            if ($receipts->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'error' => 'No receipts found'
                ], 404);
            }

            $updated = 0;
            $errors = [];
            
            foreach ($receipts as $receipt) {
                try {
                    $updates = ['status' => $newStatus];
                    
                    // Update corresponding timestamp
                    switch ($newStatus) {
                        case 'sent':
                            if (!$receipt->sent_at) {
                                $updates['sent_at'] = now();
                            }
                            break;
                        case 'viewed':
                            if (!$receipt->viewed_at) {
                                $updates['viewed_at'] = now();
                            }
                            break;
                        case 'downloaded':
                            if (!$receipt->downloaded_at) {
                                $updates['downloaded_at'] = now();
                            }
                            break;
                    }
                    
                    $receipt->update($updates);
                    $updated++;
                    
                } catch (\Exception $e) {
                    $errors[] = [
                        'receipt_number' => $receipt->receipt_number,
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            // Log bulk update
            Log::info('Bulk receipt status update:', [
                'total_receipts' => count($receiptNumbers),
                'updated_count' => $updated,
                'new_status' => $newStatus,
                'admin_notes' => $notes,
                'updated_by' => auth()->id() ?? 'system',
                'errors' => $errors
            ]);

            return response()->json([
                'success' => true,
                'message' => "Successfully updated {$updated} receipt(s)",
                'data' => [
                    'updated_count' => $updated,
                    'total_count' => count($receiptNumbers),
                    'new_status' => $newStatus,
                    'errors' => $errors
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Bulk receipt status update failed:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to update receipt statuses'
            ], 500);
        }
    }

    /**
     * List recent receipts for a customer
     * GET /api/receipts?phone={phone}&email={email}
     */
    public function listReceipts(Request $request)
    {
        try {
            $phone = $request->query('phone');
            $email = $request->query('email');
            $limit = $request->query('limit', 10);

            if (!$phone && !$email) {
                return response()->json([
                    'success' => false,
                    'error' => 'Phone number or email is required'
                ], 400);
            }

            // Get receipts using service
            $result = $this->receiptService->getCustomerReceipts($phone, $email, $limit);
            
            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'error' => $result['error']
                ], 500);
            }

            $receipts = $result['receipts']->map(function ($receipt) {
                return [
                    'receipt_number' => $receipt->receipt_number,
                    'order_reference' => $receipt->order_reference,
                    'amount' => $receipt->payment_amount,
                    'formatted_amount' => $receipt->formatted_amount,
                    'product_name' => $receipt->product_name,
                    'payment_date' => $receipt->payment_date,
                    'payment_type' => $receipt->payment_type,
                    'mpesa_receipt' => $receipt->mpesa_receipt_number,
                    'status' => $receipt->status,
                    'receipt_url' => $receipt->receipt_url,
                    'download_url' => $receipt->download_url,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $receipts,
                'total' => $result['total']
            ]);

        } catch (\Exception $e) {
            Log::error('Receipt listing failed:', [
                'phone' => $phone ?? null,
                'email' => $email ?? null,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to list receipts'
            ], 500);
        }
    }
} 