<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsDebugger
{
    /**
     * Handle an incoming request and add CORS debugging headers.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Log CORS request details
        \Log::info('CORS Debug - Request Details:', [
            'method' => $request->method(),
            'origin' => $request->header('Origin'),
            'url' => $request->fullUrl(),
            'headers' => $request->headers->all(),
            'is_preflight' => $request->isMethod('OPTIONS'),
        ]);

        // Handle preflight OPTIONS requests
        if ($request->isMethod('OPTIONS')) {
            $response = response('', 200);
        } else {
            $response = $next($request);
        }

        // Add comprehensive CORS headers
        $origin = $request->header('Origin');
        
        // Allow specific origins
        $allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://fb8f95b65e4d.ngrok-free.app',
        ];
        
        if (in_array($origin, $allowedOrigins) || 
            preg_match('#^https://[a-z0-9\-]+\.ngrok-free\.app$#', $origin) ||
            str_starts_with($origin, 'http://localhost:')) {
            
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        $response->headers->set('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, ngrok-skip-browser-warning');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Max-Age', '86400');

        \Log::info('CORS Debug - Response Headers:', [
            'status' => $response->getStatusCode(),
            'origin_header' => $response->headers->get('Access-Control-Allow-Origin'),
            'all_cors_headers' => array_filter($response->headers->all(), function($key) {
                return str_starts_with(strtolower($key), 'access-control-');
            }, ARRAY_FILTER_USE_KEY),
        ]);

        return $response;
    }
} 