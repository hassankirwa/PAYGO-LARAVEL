<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // For now, allow all authenticated users
        // In production, you might want to check for admin role
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $rules = [
            'category_id' => 'required|exists:product_categories,id',
            'name' => 'required|string|max:255',
            'model_code' => 'required|string|max:50',
            'description_text' => 'nullable|string|max:1000',
            'long_description' => 'nullable|string|max:5000',
            'capacity_litres' => 'nullable|integer|min:1|max:1000',
            'power_consumption_watts' => 'nullable|integer|min:1|max:5000',
            'color' => 'nullable|string|max:50',
            'defrost_type' => 'nullable|in:Manual,Automatic',
            'cash_warranty_months' => 'nullable|integer|min:0|max:120',
            'paygo_warranty_months' => 'nullable|integer|min:0|max:120',
            'price_ksh' => 'required|numeric|min:0|max:9999999.99',
            'weekly_installment_ksh' => 'required|numeric|min:0|max:999999.99',
            'monthly_installment_ksh' => 'nullable|numeric|min:0|max:999999.99',
            'features' => 'nullable|array',
            'features.*' => 'string|max:100',
            'images' => 'nullable|array',
            'images.*' => 'string|max:500',
            'is_active' => 'nullable|boolean',
        ];

        // For updates, make model_code unique except for current product
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $productId = $this->route('product')->id ?? null;
            $rules['model_code'] .= "|unique:products,model_code,{$productId}";
        } else {
            // For creation, model_code must be unique
            $rules['model_code'] .= '|unique:products,model_code';
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'category_id.required' => 'Product category is required.',
            'category_id.exists' => 'Selected category does not exist.',
            'name.required' => 'Product name is required.',
            'name.max' => 'Product name cannot exceed 255 characters.',
            'model_code.required' => 'Model code is required.',
            'model_code.unique' => 'This model code already exists.',
            'model_code.max' => 'Model code cannot exceed 50 characters.',
            'description_text.max' => 'Description cannot exceed 1000 characters.',
            'long_description.max' => 'Long description cannot exceed 5000 characters.',
            'capacity_litres.integer' => 'Capacity must be a whole number.',
            'capacity_litres.min' => 'Capacity must be at least 1 litre.',
            'capacity_litres.max' => 'Capacity cannot exceed 1000 litres.',
            'power_consumption_watts.integer' => 'Power consumption must be a whole number.',
            'power_consumption_watts.min' => 'Power consumption must be at least 1 watt.',
            'power_consumption_watts.max' => 'Power consumption cannot exceed 5000 watts.',
            'color.max' => 'Color name cannot exceed 50 characters.',
            'defrost_type.in' => 'Defrost type must be either Manual or Automatic.',
            'cash_warranty_months.integer' => 'Cash warranty must be a whole number of months.',
            'cash_warranty_months.min' => 'Cash warranty cannot be negative.',
            'cash_warranty_months.max' => 'Cash warranty cannot exceed 120 months.',
            'paygo_warranty_months.integer' => 'PayGo warranty must be a whole number of months.',
            'paygo_warranty_months.min' => 'PayGo warranty cannot be negative.',
            'paygo_warranty_months.max' => 'PayGo warranty cannot exceed 120 months.',
            'price_ksh.required' => 'Product price is required.',
            'price_ksh.numeric' => 'Price must be a valid number.',
            'price_ksh.min' => 'Price cannot be negative.',
            'price_ksh.max' => 'Price cannot exceed KSh 9,999,999.99.',
            'weekly_installment_ksh.required' => 'Weekly installment amount is required.',
            'weekly_installment_ksh.numeric' => 'Weekly installment must be a valid number.',
            'weekly_installment_ksh.min' => 'Weekly installment cannot be negative.',
            'weekly_installment_ksh.max' => 'Weekly installment cannot exceed KSh 999,999.99.',
            'monthly_installment_ksh.numeric' => 'Monthly installment must be a valid number.',
            'monthly_installment_ksh.min' => 'Monthly installment cannot be negative.',
            'monthly_installment_ksh.max' => 'Monthly installment cannot exceed KSh 999,999.99.',
            'features.array' => 'Features must be provided as a list.',
            'features.*.string' => 'Each feature must be text.',
            'features.*.max' => 'Each feature cannot exceed 100 characters.',
            'images.array' => 'Images must be provided as a list.',
            'images.*.string' => 'Each image must be a valid URL or path.',
            'images.*.max' => 'Each image URL cannot exceed 500 characters.',
            'is_active.boolean' => 'Active status must be true or false.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'category_id' => 'category',
            'model_code' => 'model code',
            'description_text' => 'description',
            'long_description' => 'detailed description',
            'capacity_litres' => 'capacity',
            'power_consumption_watts' => 'power consumption',
            'defrost_type' => 'defrost type',
            'cash_warranty_months' => 'cash warranty period',
            'paygo_warranty_months' => 'PayGo warranty period',
            'price_ksh' => 'price',
            'weekly_installment_ksh' => 'weekly installment',
            'monthly_installment_ksh' => 'monthly installment',
            'is_active' => 'active status',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Custom validation: weekly installment should be reasonable compared to price
            if ($this->has('price_ksh') && $this->has('weekly_installment_ksh')) {
                $price = (float) $this->input('price_ksh');
                $weeklyInstallment = (float) $this->input('weekly_installment_ksh');
                
                if ($weeklyInstallment > $price) {
                    $validator->errors()->add(
                        'weekly_installment_ksh', 
                        'Weekly installment cannot be greater than the total price.'
                    );
                }
                
                // Check if weekly installment makes sense (not too low)
                if ($price > 0 && $weeklyInstallment > 0) {
                    $totalWeeks = $price / $weeklyInstallment;
                    if ($totalWeeks > 260) { // More than 5 years
                        $validator->errors()->add(
                            'weekly_installment_ksh', 
                            'Weekly installment is too low. Payment period would exceed 5 years.'
                        );
                    }
                }
            }
            
            // Validate monthly installment against weekly if both provided
            if ($this->has('weekly_installment_ksh') && $this->has('monthly_installment_ksh')) {
                $weeklyInstallment = (float) $this->input('weekly_installment_ksh');
                $monthlyInstallment = (float) $this->input('monthly_installment_ksh');
                $expectedMonthly = round($weeklyInstallment * 4.33, 2);
                
                if (abs($monthlyInstallment - $expectedMonthly) > 1.00) {
                    $validator->errors()->add(
                        'monthly_installment_ksh', 
                        "Monthly installment should be approximately $expectedMonthly based on weekly installment."
                    );
                }
            }
        });
    }
}
