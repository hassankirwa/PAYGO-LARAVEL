<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | M-Pesa Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for M-Pesa STK Push and C2B payments
    |
    */
    'mpesa' => [
        'consumer_key' => env('CONSUMER_KEY'),
        'consumer_secret' => env('CONSUMER_SECRET'),
        'passkey' => env('PASS_KEY'),
        'shortcode' => env('BUSINESS_SHORTCODE', '174379'),
        'environment' => env('MPESA_ENV', 'sandbox'),
        'stk_callback_url' => env('STK_CALLBACK_URL'),
        'confirmation_url' => env('CONFIRMATION_URL'),
        'validation_url' => env('VALIDATION_URL'),
    ],

];
