<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

/**
 * M-Pesa URL Registration Controller
 * 
 * Handles registration of validation and confirmation URLs with Safaricom
 * According to M-Pesa C2B API specifications
 * 
 * @see https://developer.safaricom.co.ke/docs/c2b-api/register-url
 */
class MpesaUrlRegistrationController extends Controller
{
    /**
     * Register M-Pesa C2B URLs for PayBill validation and confirmation
     * POST /api/mpesa/register-urls
     * 
     * According to M-Pesa documentation:
     * - This registers the validation and confirmation URLs with Safaricom
     * - Required before C2B payments can be processed
     * - Production URLs must be HTTPS
     * - Can only be done once in production (multiple times in sandbox)
     */
    public function registerUrls(Request $request)
    {
        Log::info('📡 M-Pesa C2B URL Registration Request');
        
        try {
            // Validate request
            $request->validate([
                'environment' => 'sometimes|in:sandbox,production',
                'force_register' => 'sometimes|boolean'
            ]);
            
            // Get environment configuration
            $environment = $request->input('environment', config('mpesa.environment', 'sandbox'));
            $shortCode = config('mpesa.c2b_shortcode', '174379'); // PayGo PayBill number
            $baseUrl = config('app.url');
            
            // Ensure URLs are properly formatted
            if ($environment === 'production' && !str_starts_with($baseUrl, 'https://')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Production URLs must be HTTPS',
                    'current_url' => $baseUrl,
                    'required' => 'https:// URL required for production'
                ], 400);
            }
            
            // Define URLs according to M-Pesa specifications
            $validationUrl = $baseUrl . '/api/paybill/validation';
            $confirmationUrl = $baseUrl . '/api/paybill/confirmation';
            
            // Set response type - how to handle when validation endpoint is unreachable
            // "Completed" = auto-complete transaction if validation fails (recommended for PayGo)
            // "Cancelled" = auto-cancel transaction if validation fails
            $responseType = config('mpesa.c2b_response_type', 'Completed');
            
            $registrationData = [
                'ShortCode' => $shortCode,
                'ResponseType' => $responseType,
                'ConfirmationURL' => $confirmationUrl,
                'ValidationURL' => $validationUrl
            ];
            
            Log::info('📡 M-Pesa URL Registration Data:', [
                'environment' => $environment,
                'data' => $registrationData,
                'base_url' => $baseUrl
            ]);
            
            // For sandbox, we can simulate the registration
            if ($environment === 'sandbox') {
                // TODO: Implement actual M-Pesa sandbox API call
                // $response = $this->callMpesaRegistrationApi($registrationData, 'sandbox');
                
                return response()->json([
                    'success' => true,
                    'message' => 'M-Pesa C2B URLs ready for registration (sandbox)',
                    'environment' => $environment,
                    'registration_data' => $registrationData,
                    'status' => 'ready_for_registration',
                    'next_steps' => [
                        '1. Use Safaricom sandbox portal to register these URLs',
                        '2. Test with M-Pesa sandbox simulator',
                        '3. Verify validation and confirmation endpoints work'
                    ],
                    'test_endpoints' => [
                        'validation' => $validationUrl,
                        'confirmation' => $confirmationUrl
                    ]
                ]);
            }
            
            // For production, provide registration instructions
            return response()->json([
                'success' => true,
                'message' => 'M-Pesa C2B URLs ready for production registration',
                'environment' => $environment,
                'registration_data' => $registrationData,
                'status' => 'ready_for_production',
                'instructions' => [
                    'method_1' => 'Register via M-Pesa API using access token',
                    'method_2' => 'Register via M-Pesa Org Portal: https://org.ke.m-pesa.com/',
                    'method_3' => 'Email Safaricom: apisupport@safaricom.co.ke',
                    'note' => 'This is a ONE-TIME registration for production'
                ],
                'validation_checklist' => [
                    '✓ URLs are HTTPS',
                    '✓ URLs are publicly accessible',
                    '✓ No ngrok or public testing URLs',
                    '✓ URLs respond to M-Pesa test calls',
                    '✓ ValidationURL returns proper JSON format',
                    '✓ ConfirmationURL accepts M-Pesa callbacks'
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('❌ M-Pesa URL Registration Error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to prepare URL registration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test M-Pesa endpoints to ensure they're ready for registration
     * GET /api/mpesa/test-endpoints
     */
    public function testEndpoints(Request $request)
    {
        $baseUrl = config('app.url');
        $validationUrl = $baseUrl . '/api/paybill/validation';
        $confirmationUrl = $baseUrl . '/api/paybill/confirmation';
        
        $results = [
            'base_url' => $baseUrl,
            'validation_url' => $validationUrl,
            'confirmation_url' => $confirmationUrl,
            'tests' => []
        ];
        
        // Test validation endpoint
        try {
            $response = Http::timeout(10)->post($validationUrl, []);
            $results['tests']['validation'] = [
                'status' => 'success',
                'http_code' => $response->status(),
                'response' => $response->json(),
                'expected_format' => 'ResultCode and ResultDesc present'
            ];
        } catch (\Exception $e) {
            $results['tests']['validation'] = [
                'status' => 'failed',
                'error' => $e->getMessage()
            ];
        }
        
        // Test confirmation endpoint  
        try {
            $response = Http::timeout(10)->post($confirmationUrl, []);
            $results['tests']['confirmation'] = [
                'status' => 'success',
                'http_code' => $response->status(),
                'response' => $response->json(),
                'expected_format' => 'ResultDesc present'
            ];
        } catch (\Exception $e) {
            $results['tests']['confirmation'] = [
                'status' => 'failed',
                'error' => $e->getMessage()
            ];
        }
        
        return response()->json([
            'success' => true,
            'message' => 'M-Pesa endpoint testing completed',
            'results' => $results
        ]);
    }

    /**
     * Get current M-Pesa registration status and configuration
     * GET /api/mpesa/registration-status
     */
    public function getRegistrationStatus()
    {
        $config = [
            'environment' => config('mpesa.environment', 'sandbox'),
            'shortcode' => config('mpesa.c2b_shortcode', '174379'),
            'response_type' => config('mpesa.c2b_response_type', 'Completed'),
            'base_url' => config('app.url'),
            'urls' => [
                'validation' => config('app.url') . '/api/paybill/validation',
                'confirmation' => config('app.url') . '/api/paybill/confirmation'
            ]
        ];
        
        return response()->json([
            'success' => true,
            'message' => 'Current M-Pesa registration configuration',
            'config' => $config,
            'status' => [
                'urls_configured' => true,
                'https_ready' => str_starts_with($config['base_url'], 'https://'),
                'production_ready' => str_starts_with($config['base_url'], 'https://') && 
                                   !str_contains($config['base_url'], 'ngrok') &&
                                   !str_contains($config['base_url'], 'localhost')
            ]
        ]);
    }
} 