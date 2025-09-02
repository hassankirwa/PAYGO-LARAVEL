<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;

class ProductController extends Controller
{
    /**
     * Display a listing of products with filtering and search
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category');

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function (Builder $q) use ($searchTerm) {
                $q->where('name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('model_code', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('description_text', 'LIKE', "%{$searchTerm}%");
            });
        }

        // Category filter
        if ($request->has('category_id') && !empty($request->category_id)) {
            $query->where('category_id', $request->category_id);
        }

        // Price range filter
        if ($request->has('min_price') && !empty($request->min_price)) {
            $query->where('price_ksh', '>=', $request->min_price);
        }
        
        if ($request->has('max_price') && !empty($request->max_price)) {
            $query->where('price_ksh', '<=', $request->max_price);
        }

        // Capacity filter
        if ($request->has('min_capacity') && !empty($request->min_capacity)) {
            $query->where('capacity_litres', '>=', $request->min_capacity);
        }
        
        if ($request->has('max_capacity') && !empty($request->max_capacity)) {
            $query->where('capacity_litres', '<=', $request->max_capacity);
        }

        // Color filter
        if ($request->has('color') && !empty($request->color)) {
            $query->where('color', $request->color);
        }

        // Only active products
        $query->where('is_active', true);

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        
        $allowedSortFields = ['name', 'price_ksh', 'capacity_litres', 'weekly_installment_ksh', 'created_at'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination
        $perPage = min($request->get('per_page', 12), 50); // Max 50 items per page
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Products retrieved successfully',
            'data' => $products,
            'filters' => [
                'categories' => ProductCategory::where('is_active', true)->get(),
                'price_range' => [
                    'min' => Product::where('is_active', true)->min('price_ksh'),
                    'max' => Product::where('is_active', true)->max('price_ksh'),
                ],
                'capacity_range' => [
                    'min' => Product::where('is_active', true)->min('capacity_litres'),
                    'max' => Product::where('is_active', true)->max('capacity_litres'),
                ],
                'colors' => Product::where('is_active', true)->distinct()->pluck('color')->filter()
            ]
        ]);
    }

    /**
     * Display a listing of all products for admin (including inactive)
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Product::with('category');

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function (Builder $q) use ($searchTerm) {
                $q->where('name', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('model_code', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('description_text', 'LIKE', "%{$searchTerm}%");
            });
        }

        // Category filter
        if ($request->has('category_id') && !empty($request->category_id)) {
            $query->where('category_id', $request->category_id);
        }

        // Status filter (for admin to see all products)
        if ($request->has('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
            // If 'all', don't filter by status
        } else {
            // Default: show all products for admin
        }

        // Price range filter
        if ($request->has('min_price') && !empty($request->min_price)) {
            $query->where('price_ksh', '>=', $request->min_price);
        }
        
        if ($request->has('max_price') && !empty($request->max_price)) {
            $query->where('price_ksh', '<=', $request->max_price);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        $allowedSortFields = ['name', 'price_ksh', 'capacity_litres', 'weekly_installment_ksh', 'created_at', 'updated_at'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination
        $perPage = min($request->get('per_page', 15), 50); // Max 50 items per page
        $products = $query->paginate($perPage);

        // Get categories for filter dropdown
        $categories = ProductCategory::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'message' => 'Products retrieved successfully',
            'data' => $products,
            'meta' => [
                'categories' => $categories,
                'total_active' => Product::where('is_active', true)->count(),
                'total_inactive' => Product::where('is_active', false)->count(),
                'total_products' => Product::count(),
            ]
        ]);
    }

    /**
     * Store a newly created product
     */
    public function store(ProductRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        // Calculate monthly installment if not provided
        if (!isset($validated['monthly_installment_ksh']) && isset($validated['weekly_installment_ksh'])) {
            $validated['monthly_installment_ksh'] = round($validated['weekly_installment_ksh'] * 4.33, 2);
        }

        $product = Product::create($validated);
        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product
        ], 201);
    }

    /**
     * Display the specified product
     */
    public function show(Product $product): JsonResponse
    {
        $product->load('category');
        
        return response()->json([
            'success' => true,
            'message' => 'Product retrieved successfully',
            'data' => $product
        ]);
    }

    /**
     * Update the specified product
     */
    public function update(ProductRequest $request, Product $product): JsonResponse
    {
        $validated = $request->validated();
        
        // Calculate monthly installment if not provided
        if (!isset($validated['monthly_installment_ksh']) && isset($validated['weekly_installment_ksh'])) {
            $validated['monthly_installment_ksh'] = round($validated['weekly_installment_ksh'] * 4.33, 2);
        }

        $product->update($validated);
        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product
        ]);
    }

    /**
     * Remove the specified product
     */
    public function destroy(Product $product): JsonResponse
    {
        // Soft delete by marking as inactive
        $product->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    }

    /**
     * Get product categories
     */
    public function categories(): JsonResponse
    {
        $categories = ProductCategory::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'message' => 'Categories retrieved successfully',
            'data' => $categories
        ]);
    }

    /**
     * Get featured products
     */
    public function featured(): JsonResponse
    {
        $products = Product::with('category')
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Featured products retrieved successfully',
            'data' => $products
        ]);
    }

    /**
     * Check product availability in specific location
     */
    public function checkAvailability(Product $product, Request $request): JsonResponse
    {
        $request->validate([
            'location' => 'required|string|max:255',
            'postal_code' => 'nullable|string|max:20'
        ]);

        // For now, return mock availability data
        // In production, this would check against delivery zones, stock, etc.
        $availability = [
            'available' => true,
            'estimated_delivery_days' => rand(3, 7),
            'delivery_cost_usd' => 25.00,
            'installation_available' => true,
            'installation_cost_usd' => 15.00,
            'nearest_service_center' => [
                'name' => 'KOYO Service Center - Nairobi',
                'address' => 'Industrial Area, Nairobi',
                'phone' => '+254-700-123456',
                'distance_km' => rand(5, 20)
            ]
        ];

        return response()->json([
            'success' => true,
            'message' => 'Availability checked successfully',
            'data' => $availability
        ]);
    }
}
