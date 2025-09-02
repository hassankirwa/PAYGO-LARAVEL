<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Services\PayGoPlanCalculator;

class PayGoPlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Allow all users to calculate payment plans
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'frequency' => 'required|in:weekly,monthly,quarterly',
            'duration_months' => 'required|in:' . implode(',', PayGoPlanCalculator::AVAILABLE_DURATIONS),
            'down_payment' => 'required|numeric|min:0',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'frequency.required' => 'Payment frequency is required.',
            'frequency.in' => 'Payment frequency must be weekly, monthly, or quarterly.',
            'duration_months.required' => 'Plan duration is required.',
            'duration_months.in' => 'Plan duration must be one of: ' . implode(', ', PayGoPlanCalculator::AVAILABLE_DURATIONS) . ' months.',
            'down_payment.required' => 'Down payment amount is required.',
            'down_payment.numeric' => 'Down payment must be a valid number.',
            'down_payment.min' => 'Down payment cannot be negative.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->hasDownPaymentValidation()) {
                $this->validateDownPayment($validator);
            }
            
            if ($this->hasQuarterlyValidation()) {
                $this->validateQuarterlyFrequency($validator);
            }
        });
    }

    /**
     * Check if we need to validate down payment against product price
     */
    protected function hasDownPaymentValidation(): bool
    {
        return $this->route('product') && $this->has('down_payment');
    }

    /**
     * Check if we need to validate quarterly frequency duration
     */
    protected function hasQuarterlyValidation(): bool
    {
        return $this->frequency === 'quarterly' && $this->has('duration_months');
    }

    /**
     * Validate down payment against product price
     */
    protected function validateDownPayment($validator)
    {
        $product = $this->route('product');
        $downPayment = $this->down_payment;
        $productPrice = $product->price_ksh;

        $minDownPayment = $productPrice * PayGoPlanCalculator::MIN_DOWN_PAYMENT_PERCENTAGE;
        $maxDownPayment = $productPrice * PayGoPlanCalculator::MAX_DOWN_PAYMENT_PERCENTAGE;

        if ($downPayment < $minDownPayment) {
            $validator->errors()->add(
                'down_payment',
                "Down payment must be at least KSh " . number_format($minDownPayment, 2) . " (" . (PayGoPlanCalculator::MIN_DOWN_PAYMENT_PERCENTAGE * 100) . "% of product price)."
            );
        }

        if ($downPayment > $maxDownPayment) {
            $validator->errors()->add(
                'down_payment',
                "Down payment cannot exceed KSh " . number_format($maxDownPayment, 2) . " (" . (PayGoPlanCalculator::MAX_DOWN_PAYMENT_PERCENTAGE * 100) . "% of product price)."
            );
        }

        if ($downPayment >= $productPrice) {
            $validator->errors()->add(
                'down_payment',
                "Down payment cannot be equal to or greater than the product price."
            );
        }
    }

    /**
     * Validate quarterly frequency duration requirements
     */
    protected function validateQuarterlyFrequency($validator)
    {
        $duration = $this->duration_months;

        if ($duration < 12) {
            $validator->errors()->add(
                'duration_months',
                'Quarterly payment plans are only available for durations of 12 months or longer.'
            );
        }

        if ($duration % 3 !== 0) {
            $validator->errors()->add(
                'duration_months',
                'Quarterly payment plans require durations that are divisible by 3 months.'
            );
        }
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'frequency' => 'payment frequency',
            'duration_months' => 'plan duration',
            'down_payment' => 'down payment amount',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        $response = response()->json([
            'success' => false,
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
            'validation_context' => [
                'available_frequencies' => ['weekly', 'monthly', 'quarterly'],
                'available_durations' => PayGoPlanCalculator::AVAILABLE_DURATIONS,
                'down_payment_range' => [
                    'min_percentage' => PayGoPlanCalculator::MIN_DOWN_PAYMENT_PERCENTAGE * 100,
                    'max_percentage' => PayGoPlanCalculator::MAX_DOWN_PAYMENT_PERCENTAGE * 100,
                ]
            ]
        ], 422);

        throw new \Illuminate\Http\Exceptions\HttpResponseException($response);
    }
} 