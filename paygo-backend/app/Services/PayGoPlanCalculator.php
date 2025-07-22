<?php

namespace App\Services;

use App\Models\Product;
use Carbon\Carbon;

class PayGoPlanCalculator
{
    // Available plan durations in months
    const AVAILABLE_DURATIONS = [6, 12, 18, 24];

    // Minimum down payment percentage
    const MIN_DOWN_PAYMENT_PERCENTAGE = 0.10; // 10%
    const MAX_DOWN_PAYMENT_PERCENTAGE = 0.50; // 50%

    /**
     * Calculate available payment plans for a product
     */
    public function calculatePlansForProduct(Product $product, array $options = [])
    {
        $basePrice = $product->price_ksh;
        $plans = [];

        foreach (self::AVAILABLE_DURATIONS as $duration) {
            // Weekly plans
            $weeklyPlan = $this->calculatePlan([
                'product_id' => $product->id,
                'base_price' => $basePrice,
                'frequency' => 'weekly',
                'duration_months' => $duration,
                'down_payment' => $options['down_payment'] ?? ($basePrice * self::MIN_DOWN_PAYMENT_PERCENTAGE)
            ]);

            // Monthly plans
            $monthlyPlan = $this->calculatePlan([
                'product_id' => $product->id,
                'base_price' => $basePrice,
                'frequency' => 'monthly',
                'duration_months' => $duration,
                'down_payment' => $options['down_payment'] ?? ($basePrice * self::MIN_DOWN_PAYMENT_PERCENTAGE)
            ]);

            // Quarterly plans (only for 12+ months)
            if ($duration >= 12) {
                $quarterlyPlan = $this->calculatePlan([
                    'product_id' => $product->id,
                    'base_price' => $basePrice,
                    'frequency' => 'quarterly',
                    'duration_months' => $duration,
                    'down_payment' => $options['down_payment'] ?? ($basePrice * self::MIN_DOWN_PAYMENT_PERCENTAGE)
                ]);
                
                $plans[] = $quarterlyPlan;
            }

            $plans[] = $weeklyPlan;
            $plans[] = $monthlyPlan;
        }

        return $plans;
    }

    /**
     * Calculate a specific payment plan (NO INTEREST)
     */
    public function calculatePlan(array $params)
    {
        $basePrice = $params['base_price'];
        $frequency = $params['frequency'];
        $durationMonths = $params['duration_months'];
        $downPayment = $params['down_payment'];

        // Validate inputs
        if ($downPayment < ($basePrice * self::MIN_DOWN_PAYMENT_PERCENTAGE)) {
            throw new \InvalidArgumentException('Down payment too low');
        }

        if ($downPayment > ($basePrice * self::MAX_DOWN_PAYMENT_PERCENTAGE)) {
            throw new \InvalidArgumentException('Down payment too high');
        }

        // Calculate financing amount (amount to be paid in installments)
        $financingAmount = $basePrice - $downPayment;
        
        // Calculate total installments
        $totalInstallments = $this->calculateTotalInstallments($frequency, $durationMonths);
        
        // Calculate installment amount WITHOUT interest - simple division
        $installmentAmount = $financingAmount / $totalInstallments;
        
        // Calculate totals (no interest, so total cost = base price)
        $totalInstallmentCost = $installmentAmount * $totalInstallments;
        $totalCost = $downPayment + $totalInstallmentCost; // Should equal base price
        $totalInterest = 0; // No interest charged
        $savingsVsCash = 0; // No savings since total cost equals base price

        // Calculate schedule
        $paymentSchedule = $this->generatePaymentSchedule($installmentAmount, $totalInstallments, $frequency);

        return [
            'product_id' => $params['product_id'],
            'frequency' => $frequency,
            'duration_months' => $durationMonths,
            'base_price' => round($basePrice, 2),
            'down_payment' => round($downPayment, 2),
            'financing_amount' => round($financingAmount, 2),
            'installment_amount' => round($installmentAmount, 2),
            'total_installments' => $totalInstallments,
            'total_installment_cost' => round($totalInstallmentCost, 2),
            'total_cost' => round($totalCost, 2),
            'total_interest' => round($totalInterest, 2),
            'interest_rate_annual' => 0,
            'savings_vs_cash' => round($savingsVsCash, 2),
            'payment_schedule' => $paymentSchedule,
            'grace_period_days' => 3,
            'late_fee_percentage' => 5.0,
            'early_payment_discount' => 0.02 // 2% discount for early payment
        ];
    }

    /**
     * Compare multiple payment plans
     */
    public function comparePlans(array $plans)
    {
        // Sort by installment amount (lowest first) since total cost is same
        usort($plans, function($a, $b) {
            return $a['installment_amount'] <=> $b['installment_amount'];
        });

        $comparison = [
            'lowest_installment' => $plans[0],
            'plans' => $plans,
            'comparison_matrix' => []
        ];

        // Generate comparison matrix
        foreach ($plans as $plan) {
            $comparison['comparison_matrix'][] = [
                'frequency' => $plan['frequency'],
                'duration' => $plan['duration_months'],
                'installment' => $plan['installment_amount'],
                'total_cost' => $plan['total_cost'],
                'total_installments' => $plan['total_installments'],
                'installment_vs_lowest' => $plan['installment_amount'] - $plans[0]['installment_amount']
            ];
        }

        return $comparison;
    }

    /**
     * Calculate custom plan with user inputs
     */
    public function calculateCustomPlan(Product $product, array $customOptions)
    {
        $basePrice = $product->price_ksh;
        
        return $this->calculatePlan([
            'product_id' => $product->id,
            'base_price' => $basePrice,
            'frequency' => $customOptions['frequency'],
            'duration_months' => $customOptions['duration_months'],
            'down_payment' => $customOptions['down_payment']
        ]);
    }

    /**
     * Get plan recommendations based on budget
     */
    public function getRecommendations(Product $product, array $budget)
    {
        $maxInstallment = $budget['max_installment'];
        $preferredFrequency = $budget['preferred_frequency'] ?? 'monthly';
        
        $allPlans = $this->calculatePlansForProduct($product);
        
        // Filter plans that fit the budget
        $affordablePlans = array_filter($allPlans, function($plan) use ($maxInstallment) {
            return $plan['installment_amount'] <= $maxInstallment;
        });

        // Sort by preference and installment amount
        usort($affordablePlans, function($a, $b) use ($preferredFrequency) {
            // Prefer the specified frequency
            if ($a['frequency'] === $preferredFrequency && $b['frequency'] !== $preferredFrequency) {
                return -1;
            }
            if ($b['frequency'] === $preferredFrequency && $a['frequency'] !== $preferredFrequency) {
                return 1;
            }
            // Then sort by installment amount
            return $a['installment_amount'] <=> $b['installment_amount'];
        });

        return [
            'affordable_plans' => $affordablePlans,
            'recommended' => $affordablePlans[0] ?? null,
            'budget_analysis' => [
                'max_installment' => $maxInstallment,
                'plans_available' => count($affordablePlans),
                'lowest_installment' => $affordablePlans ? min(array_column($affordablePlans, 'installment_amount')) : null
            ]
        ];
    }

    /**
     * Calculate total number of installments
     */
    private function calculateTotalInstallments($frequency, $durationMonths)
    {
        switch ($frequency) {
            case 'weekly':
                return round($durationMonths * 4.33); // Average weeks per month
            case 'monthly':
                return $durationMonths;
            case 'quarterly':
                return round($durationMonths / 3);
            default:
                return $durationMonths;
        }
    }

    /**
     * Generate payment schedule
     */
    private function generatePaymentSchedule($installmentAmount, $totalInstallments, $frequency)
    {
        $schedule = [];
        $currentDate = Carbon::now();

        for ($i = 1; $i <= $totalInstallments; $i++) {
            switch ($frequency) {
                case 'weekly':
                    $dueDate = $currentDate->copy()->addWeeks($i);
                    break;
                case 'monthly':
                    $dueDate = $currentDate->copy()->addMonths($i);
                    break;
                case 'quarterly':
                    $dueDate = $currentDate->copy()->addMonths($i * 3);
                    break;
                default:
                    $dueDate = $currentDate->copy()->addMonths($i);
            }

            $schedule[] = [
                'installment_number' => $i,
                'due_date' => $dueDate->format('Y-m-d'),
                'amount' => round($installmentAmount, 2),
                'status' => 'pending'
            ];
        }

        return $schedule;
    }

    /**
     * Validate plan parameters
     */
    public function validatePlanParameters(array $params)
    {
        $errors = [];

        // Check required parameters
        $required = ['base_price', 'frequency', 'duration_months', 'down_payment'];
        foreach ($required as $field) {
            if (!isset($params[$field])) {
                $errors[] = "Missing required parameter: {$field}";
            }
        }

        // Validate frequency
        if (isset($params['frequency']) && !in_array($params['frequency'], ['weekly', 'monthly', 'quarterly'])) {
            $errors[] = "Invalid frequency. Must be weekly, monthly, or quarterly";
        }

        // Validate duration
        if (isset($params['duration_months']) && !in_array($params['duration_months'], self::AVAILABLE_DURATIONS)) {
            $errors[] = "Invalid duration. Must be one of: " . implode(', ', self::AVAILABLE_DURATIONS);
        }

        // Validate down payment
        if (isset($params['base_price']) && isset($params['down_payment'])) {
            $minDown = $params['base_price'] * self::MIN_DOWN_PAYMENT_PERCENTAGE;
            $maxDown = $params['base_price'] * self::MAX_DOWN_PAYMENT_PERCENTAGE;
            
            if ($params['down_payment'] < $minDown) {
                $errors[] = "Down payment must be at least $" . number_format($minDown, 2);
            }
            
            if ($params['down_payment'] > $maxDown) {
                $errors[] = "Down payment cannot exceed $" . number_format($maxDown, 2);
            }
        }

        return $errors;
    }
} 