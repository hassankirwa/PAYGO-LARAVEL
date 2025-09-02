<?php

return [
    /*
    |--------------------------------------------------------------------------
    | M-Pesa Configuration - KOYO PayGo Platform
    |--------------------------------------------------------------------------
    |
    | This file contains M-Pesa API configuration for the KOYO PayGo platform.
    | It includes settings for both STK Push and PayBill (C2B) integrations.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Environment Settings
    |--------------------------------------------------------------------------
    |
    | sandbox - For testing and development
    | production - For live transactions
    |
    */
    'environment' => env('MPESA_ENVIRONMENT', 'sandbox'),

    /*
    |--------------------------------------------------------------------------
    | STK Push Configuration (Lipa na M-Pesa Online)
    |--------------------------------------------------------------------------
    */
    'stk_push' => [
        'consumer_key' => env('MPESA_STK_CONSUMER_KEY'),
        'consumer_secret' => env('MPESA_STK_CONSUMER_SECRET'),
        'shortcode' => env('MPESA_STK_SHORTCODE'),
        'passkey' => env('MPESA_STK_PASSKEY'),
        'callback_url' => env('MPESA_STK_CALLBACK_URL', env('APP_URL') . '/api/mpesa/stk-callback'),
    ],

    /*
    |--------------------------------------------------------------------------
    | PayBill C2B Configuration
    |--------------------------------------------------------------------------
    |
    | PayBill settings for Customer-to-Business (C2B) payments
    | This is used for ongoing PayGo installment payments
    |
    */
    'c2b_shortcode' => env('MPESA_C2B_SHORTCODE', '174379'), // KOYO PayGo PayBill Number
    
    /*
    |--------------------------------------------------------------------------
    | C2B Response Type
    |--------------------------------------------------------------------------
    |
    | Determines what M-Pesa does when validation endpoint is unreachable:
    | - "Completed" = Auto-complete transaction (recommended for PayGo)
    | - "Cancelled" = Auto-cancel transaction
    |
    */
    'c2b_response_type' => env('MPESA_C2B_RESPONSE_TYPE', 'Completed'),

    /*
    |--------------------------------------------------------------------------
    | PayBill Validation & Confirmation URLs
    |--------------------------------------------------------------------------
    |
    | These URLs are registered with Safaricom for C2B callbacks
    | - Validation URL: Called before payment completion for approval/rejection
    | - Confirmation URL: Called after successful payment completion
    |
    | IMPORTANT:
    | - Production URLs MUST be HTTPS
    | - URLs must be publicly accessible (no ngrok in production)
    | - URLs cannot contain M-Pesa, Safaricom, SQL, etc. keywords
    |
    */
    'c2b_validation_url' => env('MPESA_C2B_VALIDATION_URL', env('APP_URL') . '/api/paybill/validation'),
    'c2b_confirmation_url' => env('MPESA_C2B_CONFIRMATION_URL', env('APP_URL') . '/api/paybill/confirmation'),

    /*
    |--------------------------------------------------------------------------
    | API Endpoints
    |--------------------------------------------------------------------------
    */
    'sandbox_base_url' => 'https://sandbox.safaricom.co.ke',
    'production_base_url' => 'https://api.safaricom.co.ke',

    'endpoints' => [
        'oauth' => '/oauth/v1/generate?grant_type=client_credentials',
        'c2b_register' => '/mpesa/c2b/v1/registerurl',
        'c2b_simulate' => '/mpesa/c2b/v1/simulate',
        'stk_push' => '/mpesa/stkpush/v1/processrequest',
        'stk_query' => '/mpesa/stkpushquery/v1/query',
    ],

    /*
    |--------------------------------------------------------------------------
    | Business Information
    |--------------------------------------------------------------------------
    |
    | Information displayed to customers during PayBill payments
    |
    */
    'business_info' => [
        'name' => env('MPESA_BUSINESS_NAME', 'KOYO PayGo Platform'),
        'short_code' => env('MPESA_C2B_SHORTCODE', '174379'),
        'description' => 'PayGo appliance installment payments',
        'contact_email' => env('MPESA_BUSINESS_EMAIL', 'payments@koyo.co.ke'),
        'contact_phone' => env('MPESA_BUSINESS_PHONE', '+254700000000'),
    ],

    /*
    |--------------------------------------------------------------------------
    | PayGo Platform Settings
    |--------------------------------------------------------------------------
    |
    | Business logic settings for PayGo platform validation
    |
    */
    'paygo_settings' => [
        // Device ID format validation
        'device_id_prefix' => 'KY', // All device IDs start with KY
        'device_id_min_length' => 6,
        'device_id_max_length' => 20,
        
        // Payment validation
        'require_exact_amount' => true, // Must match expected payment exactly
        'allow_overpayment' => false, // Set to true to allow overpayments
        'allow_underpayment' => false, // Set to true to allow underpayments
        
        // Amount tolerance (if exact amount is not required)
        'amount_tolerance_percentage' => 5, // Allow 5% variance
        'minimum_payment_amount' => 100, // Minimum payment in KSh
        
        // Transaction timeout
        'transaction_timeout_minutes' => 30, // How long to wait for payment completion
        
        // Notification settings
        'send_sms_notifications' => true,
        'send_email_notifications' => false,
    ],

    /*
    |--------------------------------------------------------------------------
    | M-Pesa Error Codes for C2B Validation
    |--------------------------------------------------------------------------
    |
    | Standard error codes to send to M-Pesa for transaction rejection
    |
    */
    'error_codes' => [
        'invalid_msisdn' => 'C2B00011',
        'invalid_account' => 'C2B00012', 
        'invalid_amount' => 'C2B00013',
        'invalid_kyc' => 'C2B00014',
        'invalid_shortcode' => 'C2B00015',
        'system_error' => 'C2B00016',
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Configuration
    |--------------------------------------------------------------------------
    */
    'logging' => [
        'enabled' => env('MPESA_LOGGING_ENABLED', true),
        'log_requests' => env('MPESA_LOG_REQUESTS', true),
        'log_responses' => env('MPESA_LOG_RESPONSES', true),
        'log_validation' => env('MPESA_LOG_VALIDATION', true),
        'log_confirmation' => env('MPESA_LOG_CONFIRMATION', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Settings
    |--------------------------------------------------------------------------
    */
    'security' => [
        // IP whitelist for M-Pesa callbacks (optional)
        'allowed_ips' => [
            // Add Safaricom IP addresses here when available
        ],
        
        // Request validation
        'validate_source' => env('MPESA_VALIDATE_SOURCE', false),
        'require_https' => env('MPESA_REQUIRE_HTTPS', true),
    ],
]; 