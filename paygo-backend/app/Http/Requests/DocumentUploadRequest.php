<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentUploadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only authenticated clients can upload KYC documents
        return auth('client')->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // ID Documents (Front and Back)
            'id_document_front' => [
                'nullable',
                'file',
                'mimes:jpeg,jpg,png,pdf',
                'max:5120', // 5MB max
                'dimensions:min_width=500,min_height=500,max_width=4000,max_height=4000'
            ],
            'id_document_back' => [
                'nullable',
                'file',
                'mimes:jpeg,jpg,png,pdf',
                'max:5120', // 5MB max
                'dimensions:min_width=500,min_height=500,max_width=4000,max_height=4000'
            ],
            
            // Proof of Income Document
            'proof_of_income' => [
                'nullable',
                'file',
                'mimes:jpeg,jpg,png,pdf,doc,docx',
                'max:10240', // 10MB max for documents
            ],
            
            // Business License (for business customers)
            'business_license' => [
                'nullable',
                'file',
                'mimes:jpeg,jpg,png,pdf',
                'max:5120', // 5MB max
            ],
            
            // Profile Photo
            'profile_photo' => [
                'nullable',
                'file',
                'mimes:jpeg,jpg,png',
                'max:2048', // 2MB max for photos
                'dimensions:min_width=200,min_height=200,max_width=2000,max_height=2000'
            ],
            
            // Additional validation metadata
            'document_type' => 'nullable|string|in:national_id,passport,driving_license',
            'document_country' => 'nullable|string|max:50|default:Kenya',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            // General file validation messages
            '*.file' => 'The uploaded file must be a valid file.',
            '*.max' => 'The file size must not exceed the allowed limit.',
            
            // ID Document validation messages
            'id_document_front.mimes' => 'ID document front must be a JPEG, PNG, or PDF file.',
            'id_document_front.max' => 'ID document front must not exceed 5MB.',
            'id_document_front.dimensions' => 'ID document front must be at least 500x500 pixels and no larger than 4000x4000 pixels.',
            
            'id_document_back.mimes' => 'ID document back must be a JPEG, PNG, or PDF file.',
            'id_document_back.max' => 'ID document back must not exceed 5MB.',
            'id_document_back.dimensions' => 'ID document back must be at least 500x500 pixels and no larger than 4000x4000 pixels.',
            
            // Proof of Income validation messages
            'proof_of_income.mimes' => 'Proof of income must be a JPEG, PNG, PDF, DOC, or DOCX file.',
            'proof_of_income.max' => 'Proof of income file must not exceed 10MB.',
            
            // Business License validation messages
            'business_license.mimes' => 'Business license must be a JPEG, PNG, or PDF file.',
            'business_license.max' => 'Business license must not exceed 5MB.',
            
            // Profile Photo validation messages
            'profile_photo.mimes' => 'Profile photo must be a JPEG, JPG, or PNG file.',
            'profile_photo.max' => 'Profile photo must not exceed 2MB.',
            'profile_photo.dimensions' => 'Profile photo must be at least 200x200 pixels and no larger than 2000x2000 pixels.',
            
            // Document type validation
            'document_type.in' => 'Document type must be one of: national_id, passport, or driving_license.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $this->validateFileContent($validator);
            $this->validateBusinessDocuments($validator);
            $this->validateRequiredDocuments($validator);
        });
    }

    /**
     * Validate file content and security
     */
    protected function validateFileContent($validator)
    {
        $fileFields = ['id_document_front', 'id_document_back', 'proof_of_income', 'business_license', 'profile_photo'];
        
        foreach ($fileFields as $field) {
            if ($this->hasFile($field)) {
                $file = $this->file($field);
                
                // Check if file is actually readable
                if (!$file->isValid()) {
                    $validator->errors()->add($field, 'The uploaded file appears to be corrupted.');
                    continue;
                }
                
                // Basic security check - ensure it's not an executable
                $dangerousExtensions = ['exe', 'bat', 'sh', 'php', 'js', 'html'];
                $extension = strtolower($file->getClientOriginalExtension());
                
                if (in_array($extension, $dangerousExtensions)) {
                    $validator->errors()->add($field, 'This file type is not allowed for security reasons.');
                }
                
                // Check file size more strictly for images
                if (in_array($field, ['id_document_front', 'id_document_back', 'profile_photo'])) {
                    $this->validateImageQuality($file, $field, $validator);
                }
            }
        }
    }

    /**
     * Validate image quality and content
     */
    protected function validateImageQuality($file, $fieldName, $validator)
    {
        if (in_array($file->getClientOriginalExtension(), ['jpg', 'jpeg', 'png'])) {
            try {
                $imageInfo = getimagesize($file->getPathname());
                
                if ($imageInfo === false) {
                    $validator->errors()->add($fieldName, 'The uploaded file is not a valid image.');
                    return;
                }
                
                // Check for minimum quality requirements
                $width = $imageInfo[0];
                $height = $imageInfo[1];
                
                if ($fieldName === 'profile_photo') {
                    // Profile photos should be roughly square
                    $aspectRatio = $width / $height;
                    if ($aspectRatio < 0.75 || $aspectRatio > 1.33) {
                        $validator->errors()->add($fieldName, 'Profile photo should be approximately square (aspect ratio between 3:4 and 4:3).');
                    }
                }
                
                if (in_array($fieldName, ['id_document_front', 'id_document_back'])) {
                    // ID documents should have good resolution for OCR
                    if ($width < 800 || $height < 500) {
                        $validator->errors()->add($fieldName, 'ID document image should be at least 800x500 pixels for better quality.');
                    }
                }
                
            } catch (\Exception $e) {
                $validator->errors()->add($fieldName, 'Unable to process the uploaded image file.');
            }
        }
    }

    /**
     * Validate business-specific documents
     */
    protected function validateBusinessDocuments($validator)
    {
        // Get the authenticated client
        $client = auth('client')->user();
        
        // If this is a business customer, business license might be required
        if ($client && $client->is_business_customer && !$this->hasFile('business_license') && !$client->business_license_path) {
            $validator->errors()->add(
                'business_license',
                'Business license is required for business customers.'
            );
        }
    }

    /**
     * Validate that at least some required documents are provided
     */
    protected function validateRequiredDocuments($validator)
    {
        $client = auth('client')->user();
        
        // Check if at least one ID document is provided (either front or back)
        $hasIdFront = $this->hasFile('id_document_front') || ($client && $client->id_document_front_path);
        $hasIdBack = $this->hasFile('id_document_back') || ($client && $client->id_document_back_path);
        
        if (!$hasIdFront && !$hasIdBack) {
            $validator->errors()->add(
                'id_document_front',
                'At least one ID document (front or back) is required.'
            );
        }
        
        // For complete KYC, both front and back are preferred
        if ($hasIdFront && !$hasIdBack && !$this->hasFile('id_document_back')) {
            // This is a warning, not an error - allow submission but note it
            // Could be implemented as a warning system in the future
        }
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'id_document_front' => 'ID document (front)',
            'id_document_back' => 'ID document (back)',
            'proof_of_income' => 'proof of income document',
            'business_license' => 'business license',
            'profile_photo' => 'profile photo',
            'document_type' => 'document type',
            'document_country' => 'document country',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Set default values
        $this->merge([
            'document_country' => $this->input('document_country', 'Kenya'),
        ]);
    }
}
