<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerKycRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only authenticated clients can update their KYC information
        return auth('client')->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // Personal Information (Story 3.2)
            'date_of_birth' => 'nullable|date|before:today|after:1950-01-01',
            'national_id' => [
                'nullable',
                'string',
                'max:20',
                'unique:clients,national_id,' . auth('client')->id(),
                'regex:/^[0-9]+$/' // Only numbers for Kenyan ID
            ],
            'passport_number' => [
                'nullable',
                'string',
                'max:20',
                'unique:clients,passport_number,' . auth('client')->id()
            ],
            'nationality' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'occupation' => 'nullable|string|max:100',
            'monthly_income' => 'nullable|numeric|min:0|max:10000000',
            'income_source' => 'nullable|in:salary,business,farming,other',
            'income_verification_notes' => 'nullable|string|max:1000',
            
            // Optional GPS coordinates
            'address_latitude' => 'nullable|numeric|between:-90,90',
            'address_longitude' => 'nullable|numeric|between:-180,180',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'date_of_birth.before' => 'Date of birth must be before today.',
            'date_of_birth.after' => 'Date of birth must be after 1950.',
            'national_id.regex' => 'National ID must contain only numbers.',
            'national_id.unique' => 'This National ID is already registered.',
            'passport_number.unique' => 'This passport number is already registered.',
            'monthly_income.min' => 'Monthly income cannot be negative.',
            'monthly_income.max' => 'Monthly income seems too high. Please verify.',
            'income_source.in' => 'Income source must be one of: salary, business, farming, or other.',
            'latitude.between' => 'Latitude must be between -90 and 90 degrees.',
            'longitude.between' => 'Longitude must be between -180 and 180 degrees.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Custom validation logic
            $this->validateAge($validator);
            $this->validateIncomeConsistency($validator);
            $this->validateIdentificationDocuments($validator);
        });
    }

    /**
     * Validate that the customer is at least 18 years old
     */
    protected function validateAge($validator)
    {
        $dateOfBirth = $this->input('date_of_birth');
        
        if ($dateOfBirth) {
            $age = now()->diffInYears($dateOfBirth);
            
            if ($age < 18) {
                $validator->errors()->add(
                    'date_of_birth',
                    'You must be at least 18 years old to register for PayGo.'
                );
            }
            
            if ($age > 100) {
                $validator->errors()->add(
                    'date_of_birth',
                    'Please verify your date of birth.'
                );
            }
        }
    }

    /**
     * Validate income consistency
     */
    protected function validateIncomeConsistency($validator)
    {
        $income = $this->input('monthly_income');
        $incomeSource = $this->input('income_source');
        
        if ($income && !$incomeSource) {
            $validator->errors()->add(
                'income_source',
                'Please specify your source of income.'
            );
        }
        
        if ($incomeSource && !$income) {
            $validator->errors()->add(
                'monthly_income',
                'Please provide your monthly income amount.'
            );
        }
        
        // Validate income ranges based on source
        if ($income && $incomeSource) {
            $minIncome = match($incomeSource) {
                'salary' => 5000, // Minimum wage considerations
                'business' => 2000,
                'farming' => 1000,
                'other' => 500,
                default => 0
            };
            
            if ($income < $minIncome) {
                $validator->errors()->add(
                    'monthly_income',
                    "Monthly income seems low for a {$incomeSource} income source. Please verify."
                );
            }
        }
    }

    /**
     * Validate identification documents
     */
    protected function validateIdentificationDocuments($validator)
    {
        $nationalId = $this->input('national_id');
        $passportNumber = $this->input('passport_number');
        
        // At least one form of identification is required for complete KYC
        if (!$nationalId && !$passportNumber) {
            $validator->errors()->add(
                'national_id',
                'Either National ID or Passport number is required.'
            );
            $validator->errors()->add(
                'passport_number',
                'Either National ID or Passport number is required.'
            );
        }
        
        // Validate Kenyan National ID format (8 digits)
        if ($nationalId && !preg_match('/^[0-9]{8}$/', $nationalId)) {
            $validator->errors()->add(
                'national_id',
                'Kenyan National ID must be exactly 8 digits.'
            );
        }
        
        // Validate passport number format (basic format check)
        if ($passportNumber && !preg_match('/^[A-Z0-9]{6,9}$/', strtoupper($passportNumber))) {
            $validator->errors()->add(
                'passport_number',
                'Passport number format is invalid.'
            );
        }
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'date_of_birth' => 'date of birth',
            'national_id' => 'National ID',
            'passport_number' => 'passport number',
            'monthly_income' => 'monthly income',
            'income_source' => 'income source',
            'address_latitude' => 'GPS latitude',
            'address_longitude' => 'GPS longitude',
        ];
    }
}
