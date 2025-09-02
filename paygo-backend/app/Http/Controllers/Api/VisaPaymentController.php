<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Models\PaymentOrder;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;

class VisaPaymentController extends Controller
{
    /**
     * Process Visa/Mastercard payment
     * POST /api/visa/process-payment
     */
    public function processPayment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Card details
            'card_number' => 'required|string|regex:/^[0-9]{13,19}$/',
            'expiry_month' => 'required|string|regex:/^(0[1-9]|1[0-2])$/',
            'expiry_year' => 'required|string|regex:/^[0-9]{2}$/',
            'cvv' => 'required|string|regex:/^[0-9]{3,4}$/',
            'cardholder_name' => 'required|string|max:255',
            
            // Payment details
            'amount' => 'required|numeric|min:1',
            'currency' => 'sometimes|string|in:KES,USD',
            'description' => 'required|string|max:255',
            
            // Order details
            'order_reference' => 'required|string',
            'customer_email' => 'required|email',
            'customer_phone' => 'required|string',
            
            // Billing address
            'billing_address' => 'required|array',
            'billing_address.street' => 'required|string',
            'billing_address.city' => 'required|string',
            'billing_address.state' => 'required|string',
            'billing_address.country' => 'required|string|in:KE,Kenya',
            'billing_address.postal_code' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 400);
        }

        try {
            // Validate card number using Luhn algorithm
            if (!$this->validateCardNumber($request->card_number)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid card number'
                ], 400);
            }

            // Check if card is expired
            $currentYear = date('y');
            $currentMonth = date('m');
            
            if ($request->expiry_year < $currentYear || 
                ($request->expiry_year == $currentYear && $request->expiry_month < $currentMonth)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Card has expired'
                ], 400);
            }

            // Detect card type
            $cardType = $this->detectCardType($request->card_number);
            
            Log::info('Processing Visa/Card Payment:', [
                'order_reference' => $request->order_reference,
                'amount' => $request->amount,
                'card_type' => $cardType,
                'customer_email' => $request->customer_email,
                'masked_card' => $this->maskCardNumber($request->card_number)
            ]);

            // For now, simulate payment processing
            // In production, integrate with actual payment gateway (Flutterwave, Paystack, Stripe, etc.)
            $paymentResult = $this->simulateCardPayment($request->all(), $cardType);

            if ($paymentResult['success']) {
                // Create payment record
                $paymentRecord = $this->createPaymentRecord($request->all(), $paymentResult, $cardType);

                Log::info('✅ Visa/Card Payment Successful:', [
                    'payment_id' => $paymentRecord['payment_id'],
                    'transaction_id' => $paymentResult['transaction_id'],
                    'amount' => $request->amount,
                    'card_type' => $cardType
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Payment processed successfully',
                    'data' => [
                        'payment_id' => $paymentRecord['payment_id'],
                        'transaction_id' => $paymentResult['transaction_id'],
                        'amount' => $request->amount,
                        'currency' => $request->currency ?? 'KES',
                        'card_type' => $cardType,
                        'masked_card' => $this->maskCardNumber($request->card_number),
                        'status' => 'completed',
                        'receipt' => $paymentRecord['receipt_url']
                    ]
                ]);
            } else {
                Log::warning('❌ Visa/Card Payment Failed:', [
                    'order_reference' => $request->order_reference,
                    'amount' => $request->amount,
                    'error' => $paymentResult['error'],
                    'error_code' => $paymentResult['error_code']
                ]);

                return response()->json([
                    'success' => false,
                    'error' => $paymentResult['error'],
                    'error_code' => $paymentResult['error_code']
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('❌ Visa/Card Payment Exception:', [
                'error' => $e->getMessage(),
                'order_reference' => $request->order_reference ?? 'unknown'
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Payment processing failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate card number using Luhn algorithm
     */
    private function validateCardNumber($cardNumber)
    {
        $cardNumber = preg_replace('/\D/', '', $cardNumber);
        $sum = 0;
        $isEven = false;

        for ($i = strlen($cardNumber) - 1; $i >= 0; $i--) {
            $digit = intval($cardNumber[$i]);

            if ($isEven) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit -= 9;
                }
            }

            $sum += $digit;
            $isEven = !$isEven;
        }

        return ($sum % 10) === 0;
    }

    /**
     * Detect card type from card number
     */
    private function detectCardType($cardNumber)
    {
        $cardNumber = preg_replace('/\D/', '', $cardNumber);
        
        // Visa: starts with 4
        if (preg_match('/^4[0-9]{12}(?:[0-9]{3})?$/', $cardNumber)) {
            return 'Visa';
        }
        
        // Mastercard: starts with 5[1-5] or 2[2-7]
        if (preg_match('/^5[1-5][0-9]{14}$/', $cardNumber) || 
            preg_match('/^2[2-7][0-9]{14}$/', $cardNumber)) {
            return 'Mastercard';
        }
        
        // American Express: starts with 34 or 37
        if (preg_match('/^3[47][0-9]{13}$/', $cardNumber)) {
            return 'American Express';
        }
        
        // Discover: starts with 6
        if (preg_match('/^6(?:011|5[0-9]{2})[0-9]{12}$/', $cardNumber)) {
            return 'Discover';
        }
        
        return 'Unknown';
    }

    /**
     * Mask card number for security
     */
    private function maskCardNumber($cardNumber)
    {
        $cardNumber = preg_replace('/\D/', '', $cardNumber);
        $length = strlen($cardNumber);
        
        if ($length < 4) {
            return str_repeat('*', $length);
        }
        
        return str_repeat('*', $length - 4) . substr($cardNumber, -4);
    }

    /**
     * Simulate card payment processing
     * In production, replace with actual payment gateway integration
     */
    private function simulateCardPayment($paymentData, $cardType)
    {
        // Simulate various payment scenarios for testing
        $cardNumber = preg_replace('/\D/', '', $paymentData['card_number']);
        
        // Test card numbers for different scenarios
        $testCards = [
            '4111111111111111' => ['success' => true, 'scenario' => 'success'],
            '4000000000000002' => ['success' => false, 'error' => 'Card declined', 'error_code' => 'CARD_DECLINED'],
            '4000000000000069' => ['success' => false, 'error' => 'Expired card', 'error_code' => 'EXPIRED_CARD'],
            '4000000000000119' => ['success' => false, 'error' => 'Processing error', 'error_code' => 'PROCESSING_ERROR'],
        ];

        // Check if it's a test card
        if (isset($testCards[$cardNumber])) {
            $testResult = $testCards[$cardNumber];
            
            if ($testResult['success']) {
                return [
                    'success' => true,
                    'transaction_id' => 'TXN_' . time() . '_' . rand(1000, 9999),
                    'authorization_code' => 'AUTH_' . rand(100000, 999999),
                    'processor_response' => 'Approved',
                    'gateway' => 'Simulation Gateway'
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $testResult['error'],
                    'error_code' => $testResult['error_code']
                ];
            }
        }

        // For non-test cards, simulate success (90% success rate)
        $success = rand(1, 10) <= 9;
        
        if ($success) {
            return [
                'success' => true,
                'transaction_id' => 'TXN_' . time() . '_' . rand(1000, 9999),
                'authorization_code' => 'AUTH_' . rand(100000, 999999),
                'processor_response' => 'Approved',
                'gateway' => 'Simulation Gateway'
            ];
        } else {
            $errors = [
                ['error' => 'Insufficient funds', 'error_code' => 'INSUFFICIENT_FUNDS'],
                ['error' => 'Card declined', 'error_code' => 'CARD_DECLINED'],
                ['error' => 'Processing error', 'error_code' => 'PROCESSING_ERROR'],
            ];
            
            $randomError = $errors[array_rand($errors)];
            return [
                'success' => false,
                'error' => $randomError['error'],
                'error_code' => $randomError['error_code']
            ];
        }
    }

    /**
     * Create payment record in database
     */
    private function createPaymentRecord($paymentData, $paymentResult, $cardType)
    {
        // In a real implementation, you would save to a card_payments table
        // For now, we'll create a simplified record
        
        $paymentId = 'PAY_' . time() . '_' . rand(1000, 9999);
        $receiptUrl = url("/api/visa/receipt/{$paymentId}");
        
        // TODO: Save to database
        // CardPayment::create([...]);
        
        Log::info('Card Payment Record Created:', [
            'payment_id' => $paymentId,
            'transaction_id' => $paymentResult['transaction_id'],
            'amount' => $paymentData['amount'],
            'card_type' => $cardType,
            'masked_card' => $this->maskCardNumber($paymentData['card_number']),
            'customer_email' => $paymentData['customer_email']
        ]);
        
        return [
            'payment_id' => $paymentId,
            'receipt_url' => $receiptUrl
        ];
    }

    /**
     * Get supported card types
     * GET /api/visa/supported-cards
     */
    public function getSupportedCards()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'supported_cards' => [
                    'Visa',
                    'Mastercard',
                    'American Express'
                ],
                'currencies' => [
                    'KES' => 'Kenyan Shilling',
                    'USD' => 'US Dollar'
                ],
                'test_cards' => [
                    [
                        'number' => '4111111111111111',
                        'type' => 'Visa',
                        'scenario' => 'Success',
                        'description' => 'Always approved'
                    ],
                    [
                        'number' => '4000000000000002',
                        'type' => 'Visa',
                        'scenario' => 'Declined',
                        'description' => 'Always declined'
                    ],
                    [
                        'number' => '5555555555554444',
                        'type' => 'Mastercard',
                        'scenario' => 'Success',
                        'description' => 'Always approved'
                    ]
                ],
                'cvv_requirements' => [
                    'Visa' => '3 digits',
                    'Mastercard' => '3 digits',
                    'American Express' => '4 digits'
                ]
            ]
        ]);
    }

    /**
     * Get payment receipt
     * GET /api/visa/receipt/{paymentId}
     */
    public function getReceipt($paymentId)
    {
        try {
            // In production, fetch from database
            // $payment = CardPayment::where('payment_id', $paymentId)->first();
            
            // For now, return simulated receipt
            return response()->json([
                'success' => true,
                'data' => [
                    'payment_id' => $paymentId,
                    'receipt_number' => 'RCP_' . $paymentId,
                    'date' => now()->format('Y-m-d H:i:s'),
                    'merchant' => 'KOYO PayGo',
                    'status' => 'Completed',
                    'message' => 'Payment receipt generated successfully'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Receipt not found'
            ], 404);
        }
    }

    /**
     * Validate card details (for frontend validation)
     * POST /api/visa/validate-card
     */
    public function validateCard(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'card_number' => 'required|string',
            'expiry_month' => 'required|string',
            'expiry_year' => 'required|string',
            'cvv' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 400);
        }

        try {
            $cardNumber = preg_replace('/\D/', '', $request->card_number);
            
            // Validate card number
            $isValidNumber = $this->validateCardNumber($cardNumber);
            $cardType = $this->detectCardType($cardNumber);
            
            // Check expiry
            $currentYear = date('y');
            $currentMonth = date('m');
            $isExpired = $request->expiry_year < $currentYear || 
                        ($request->expiry_year == $currentYear && $request->expiry_month < $currentMonth);
            
            // Validate CVV length based on card type
            $expectedCvvLength = in_array($cardType, ['American Express']) ? 4 : 3;
            $isValidCvv = strlen($request->cvv) === $expectedCvvLength && ctype_digit($request->cvv);

            return response()->json([
                'success' => true,
                'data' => [
                    'is_valid' => $isValidNumber && !$isExpired && $isValidCvv,
                    'card_type' => $cardType,
                    'is_valid_number' => $isValidNumber,
                    'is_expired' => $isExpired,
                    'is_valid_cvv' => $isValidCvv,
                    'masked_number' => $this->maskCardNumber($cardNumber),
                    'expected_cvv_length' => $expectedCvvLength
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Card validation failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
