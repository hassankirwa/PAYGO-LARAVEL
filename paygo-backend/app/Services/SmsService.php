<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\SystemSetting;

class SmsService
{
    private $username;
    private $apiKey;
    private $senderId;
    private $baseUrl;

    public function __construct()
    {
        // Get SMS configuration from system settings
        $smsConfig = SystemSetting::getCategory('sms');
        
        $this->username = $smsConfig['username'] ?? env('AFRICASTALKING_USERNAME', 'koyo_paygo');
        $this->apiKey = $smsConfig['api_key'] ?? env('AFRICASTALKING_API_KEY');
        $this->senderId = $smsConfig['sender_id'] ?? env('AFRICASTALKING_SENDER_ID', 'KOYO');
        $this->baseUrl = 'https://api.africastalking.com/version1/messaging';
    }

    /**
     * Send payment confirmation SMS
     */
    public function sendPaymentConfirmation($phoneNumber, $paymentData)
    {
        $message = $this->generatePaymentConfirmationMessage($paymentData);
        return $this->sendSms($phoneNumber, $message, 'payment_confirmation');
    }

    /**
     * Send payment receipt SMS
     */
    public function sendPaymentReceipt($phoneNumber, $receiptData)
    {
        $message = $this->generateReceiptMessage($receiptData);
        return $this->sendSms($phoneNumber, $message, 'payment_receipt');
    }

    /**
     * Send plan activation SMS
     */
    public function sendPlanActivation($phoneNumber, $planData)
    {
        $message = $this->generatePlanActivationMessage($planData);
        return $this->sendSms($phoneNumber, $message, 'plan_activation');
    }

    /**
     * Generic SMS sending method
     */
    public function sendSms($phoneNumber, $message, $type = 'general')
    {
        try {
            // Format phone number for Kenya (+254)
            $formattedPhone = $this->formatPhoneNumber($phoneNumber);
            
            Log::info('Sending SMS:', [
                'phone' => $formattedPhone,
                'type' => $type,
                'message_length' => strlen($message)
            ]);

            // Use Africa's Talking API
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/x-www-form-urlencoded',
                'apiKey' => $this->apiKey
            ])->asForm()->post($this->baseUrl, [
                'username' => $this->username,
                'to' => $formattedPhone,
                'message' => $message,
                'from' => $this->senderId
            ]);

            if ($response->successful()) {
                $result = $response->json();
                
                Log::info('SMS sent successfully:', [
                    'response' => $result,
                    'phone' => $formattedPhone,
                    'type' => $type
                ]);

                return [
                    'success' => true,
                    'message_id' => $result['SMSMessageData']['Recipients'][0]['messageId'] ?? null,
                    'status' => $result['SMSMessageData']['Recipients'][0]['status'] ?? 'sent',
                    'cost' => $result['SMSMessageData']['Recipients'][0]['cost'] ?? null
                ];
            } else {
                Log::error('SMS sending failed:', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                    'phone' => $formattedPhone
                ]);

                return [
                    'success' => false,
                    'error' => 'Failed to send SMS: ' . $response->body()
                ];
            }

        } catch (\Exception $e) {
            Log::error('SMS service exception:', [
                'error' => $e->getMessage(),
                'phone' => $phoneNumber,
                'type' => $type
            ]);

            return [
                'success' => false,
                'error' => 'SMS service error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Format phone number for Kenya
     */
    private function formatPhoneNumber($phoneNumber)
    {
        // Remove any spaces, dashes, or plus signs
        $phone = preg_replace('/[\s\-\+]/', '', $phoneNumber);
        
        // If starts with 0, replace with 254
        if (substr($phone, 0, 1) === '0') {
            $phone = '254' . substr($phone, 1);
        }
        
        // If doesn't start with 254, add it
        if (substr($phone, 0, 3) !== '254') {
            $phone = '254' . $phone;
        }
        
        return '+' . $phone;
    }

    /**
     * Generate payment confirmation message
     */
    private function generatePaymentConfirmationMessage($paymentData)
    {
        $amount = number_format($paymentData['amount'], 0);
        $receipt = $paymentData['receipt_number'];
        $product = $paymentData['product_name'] ?? 'KOYO Product';
        
        return "Payment Confirmed! KSh {$amount} received for {$product}. Receipt: {$receipt}. Your PayGo plan is now active. Thank you for choosing KOYO PayGo!";
    }

    /**
     * Generate receipt message
     */
    private function generateReceiptMessage($receiptData)
    {
        $amount = number_format($receiptData['amount'], 0);
        $receipt = $receiptData['receipt_number'];
        $date = $receiptData['date'];
        $customer = $receiptData['customer_name'];
        
        return "KOYO PayGo Receipt\nCustomer: {$customer}\nAmount: KSh {$amount}\nReceipt: {$receipt}\nDate: {$date}\nThank you for your payment!";
    }

    /**
     * Generate plan activation message
     */
    private function generatePlanActivationMessage($planData)
    {
        $product = $planData['product_name'];
        $frequency = $planData['payment_frequency'];
        $amount = number_format($planData['installment_amount'], 0);
        $nextDue = $planData['next_payment_due'];
        
        return "Your KOYO PayGo plan is active! Product: {$product}. Next {$frequency} payment: KSh {$amount} due on {$nextDue}. Enjoy your appliance!";
    }

    /**
     * Check if SMS service is configured
     */
    public function isConfigured()
    {
        return !empty($this->apiKey) && !empty($this->username);
    }
} 