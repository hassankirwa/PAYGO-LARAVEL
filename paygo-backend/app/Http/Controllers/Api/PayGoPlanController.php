<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PayGoPlanRequest;
use App\Models\Product;
use App\Services\PayGoPlanCalculator;
use Illuminate\Http\Request;

class PayGoPlanController extends Controller
{
    protected $calculator;

    public function __construct(PayGoPlanCalculator $calculator)
    {
        $this->calculator = $calculator;
    }

    /**
     * Get all available payment plans for a product
     * GET /api/products/{product}/paygo-plans
     */
    public function getPlansForProduct(Product $product, Request $request)
    {
        try {
            $options = [];
            
            // Optional down payment override
            if ($request->has('down_payment')) {
                $options['down_payment'] = (float) $request->down_payment;
            }

            $plans = $this->calculator->calculatePlansForProduct($product, $options);

            return response()->json([
                'success' => true,
                'data' => [
                    'product' => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'model_code' => $product->model_code,
                        'price_usd' => $product->price_usd,
                    ],
                    'available_plans' => $plans,
                    'plan_summary' => [
                        'total_plans' => count($plans),
                        'frequencies' => array_unique(array_column($plans, 'frequency')),
                        'durations' => array_unique(array_column($plans, 'duration_months')),
                        'lowest_installment' => min(array_column($plans, 'installment_amount')),
                        'highest_installment' => max(array_column($plans, 'installment_amount'))
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to calculate payment plans: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate a custom payment plan
     * POST /api/products/{product}/paygo-plans/calculate
     */
    public function calculateCustomPlan(Product $product, PayGoPlanRequest $request)
    {
        try {
            $customOptions = [
                'frequency' => $request->frequency,
                'duration_months' => $request->duration_months,
                'down_payment' => $request->down_payment
            ];

            $plan = $this->calculator->calculateCustomPlan($product, $customOptions);

            return response()->json([
                'success' => true,
                'data' => [
                    'product' => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'price_usd' => $product->price_usd,
                    ],
                    'custom_plan' => $plan
                ]
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to calculate custom plan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Compare multiple payment plans
     * POST /api/products/{product}/paygo-plans/compare
     */
    public function comparePlans(Product $product, Request $request)
    {
        try {
            $request->validate([
                'plans' => 'required|array|min:2|max:3',
                'plans.*.frequency' => 'required|in:weekly,monthly,quarterly',
                'plans.*.duration_months' => 'required|in:6,12,18,24',
                'plans.*.down_payment' => 'required|numeric|min:0'
            ]);

            $plans = [];
            foreach ($request->plans as $planRequest) {
                $plan = $this->calculator->calculateCustomPlan($product, $planRequest);
                $plans[] = $plan;
            }

            $comparison = $this->calculator->comparePlans($plans);

            return response()->json([
                'success' => true,
                'data' => [
                    'product' => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'price_usd' => $product->price_usd,
                    ],
                    'comparison' => $comparison
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to compare plans: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get plan recommendations based on budget
     * POST /api/products/{product}/paygo-plans/recommendations
     */
    public function getRecommendations(Product $product, Request $request)
    {
        try {
            $request->validate([
                'max_installment' => 'required|numeric|min:1',
                'preferred_frequency' => 'nullable|in:weekly,monthly,quarterly'
            ]);

            $budget = [
                'max_installment' => $request->max_installment,
                'preferred_frequency' => $request->preferred_frequency ?? 'monthly'
            ];

            $recommendations = $this->calculator->getRecommendations($product, $budget);

            return response()->json([
                'success' => true,
                'data' => [
                    'product' => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'price_usd' => $product->price_usd,
                    ],
                    'budget_constraints' => $budget,
                    'recommendations' => $recommendations
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get recommendations: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get plan calculator settings and constraints
     * GET /api/paygo-plans/settings
     */
    public function getSettings()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'available_durations' => PayGoPlanCalculator::AVAILABLE_DURATIONS,
                'available_frequencies' => ['weekly', 'monthly', 'quarterly'],
                'down_payment_constraints' => [
                    'min_percentage' => PayGoPlanCalculator::MIN_DOWN_PAYMENT_PERCENTAGE * 100,
                    'max_percentage' => PayGoPlanCalculator::MAX_DOWN_PAYMENT_PERCENTAGE * 100
                ],
                'payment_terms' => [
                    'grace_period_days' => 3,
                    'late_fee_percentage' => 5.0,
                    'early_payment_discount' => 2.0,
                    'interest_rate' => 0 // No interest
                ]
            ]
        ]);
    }

    /**
     * Validate plan parameters
     * POST /api/paygo-plans/validate
     */
    public function validateParameters(Request $request)
    {
        try {
            $request->validate([
                'base_price' => 'required|numeric|min:1',
                'frequency' => 'required|in:weekly,monthly,quarterly',
                'duration_months' => 'required|in:6,12,18,24',
                'down_payment' => 'required|numeric|min:0'
            ]);

            $params = $request->only(['base_price', 'frequency', 'duration_months', 'down_payment']);
            $errors = $this->calculator->validatePlanParameters($params);

            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'errors' => $errors
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Parameters are valid'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment schedule for a specific plan
     * POST /api/products/{product}/paygo-plans/schedule
     */
    public function getPaymentSchedule(Product $product, PayGoPlanRequest $request)
    {
        try {
            $customOptions = [
                'frequency' => $request->frequency,
                'duration_months' => $request->duration_months,
                'down_payment' => $request->down_payment
            ];

            $plan = $this->calculator->calculateCustomPlan($product, $customOptions);

            return response()->json([
                'success' => true,
                'data' => [
                    'product' => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'price_usd' => $product->price_usd,
                    ],
                    'plan_summary' => [
                        'frequency' => $plan['frequency'],
                        'duration_months' => $plan['duration_months'],
                        'down_payment' => $plan['down_payment'],
                        'installment_amount' => $plan['installment_amount'],
                        'total_installments' => $plan['total_installments'],
                        'total_cost' => $plan['total_cost']
                    ],
                    'payment_schedule' => $plan['payment_schedule']
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to generate payment schedule: ' . $e->getMessage()
            ], 500);
        }
    }
} 