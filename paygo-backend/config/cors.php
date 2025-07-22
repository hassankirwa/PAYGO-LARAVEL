<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        'http://10.81.234.162:3000',
    ],

    'allowed_origins_patterns' => [
        '#^https://[a-z0-9]+\.ngrok-free\.app$#',  // Allow any ngrok URL
        '#^https://[a-z0-9]+\.ngrok\.io$#',        // Allow legacy ngrok URLs
    ],

    'allowed_headers' => ['*', 'ngrok-skip-browser-warning'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

]; 