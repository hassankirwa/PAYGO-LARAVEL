<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Http\Requests\CustomerKycRequest;
use App\Http\Requests\DocumentUploadRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    /**
     * Register a new customer with basic information
     * Story 3.1: Customer Account Registration
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|string|email|max:255|unique:clients',
            'phone' => 'required|string|max:20|unique:clients',
            'password' => 'required|string|min:8|confirmed',
            'plan_id' => 'nullable|string', // PayGo plan from Story 2
            'product_id' => 'nullable|integer|exists:products,id',
            'terms_accepted' => 'required|boolean|accepted',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $client = Client::create([
                'client_code' => Client::generateClientCode(),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password_hash' => Hash::make($request->password),
                'terms_accepted' => $request->terms_accepted,
                'terms_accepted_at' => now(),
                'registration_source' => 'web',
                'kyc_status' => 'pending',
                'eligibility_status' => 'pending',
                'is_active' => true,
                'status' => 'active',
                'payment_status' => 'current'
            ]);

            $token = $client->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'data' => [
                    'client' => $client,
                    'token' => $token,
                    'kyc_completion' => $client->getKycCompletionPercentage(),
                    'next_step' => 'personal_information'
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update personal information for KYC
     * Story 3.2: Personal Information Collection
     */
    public function updatePersonalInfo(CustomerKycRequest $request)
    {
        try {
            $client = auth('client')->user();
            
            $updateData = $request->validated();
            
            // If GPS coordinates are provided, update them
            if ($request->has('latitude') && $request->has('longitude')) {
                $updateData['address_latitude'] = $request->latitude;
                $updateData['address_longitude'] = $request->longitude;
            }
            
            $client->update($updateData);
            
            // Update KYC status based on completion
            $this->updateKycStatus($client);

            return response()->json([
                'success' => true,
                'message' => 'Personal information updated successfully',
                'data' => [
                    'client' => $client->fresh(),
                    'kyc_completion' => $client->getKycCompletionPercentage(),
                    'next_step' => $this->getNextKycStep($client)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update personal information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update business information for business customers
     * Story 3.3: Business Information Collection
     */
    public function updateBusinessInfo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'is_business_customer' => 'nullable|boolean',
            'business_name' => 'nullable|string|max:200',
            'business_registration_number' => 'nullable|string|max:50',
            'business_type' => 'nullable|string|max:100',
            'business_industry' => 'nullable|string|max:100',
            'business_address' => 'nullable|string',
            'business_employees' => 'nullable|integer|min:1',
            'kra_pin' => 'nullable|string|max:20|regex:/^[A-Z0-9]+$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $client = auth('client')->user();
            $client->update($validator->validated());
            
            $this->updateKycStatus($client);

            return response()->json([
                'success' => true,
                'message' => 'Business information updated successfully',
                'data' => [
                    'client' => $client->fresh(),
                    'kyc_completion' => $client->getKycCompletionPercentage(),
                    'next_step' => $this->getNextKycStep($client)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update business information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update reference and emergency contacts
     * Story 3.4: Reference and Emergency Contacts
     */
    public function updateContacts(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reference_contacts' => 'required|array|min:1|max:1',
            'reference_contacts.*.name' => 'required|string|max:100',
            'reference_contacts.*.phone' => 'required|string|max:20',
            'reference_contacts.*.relationship' => 'required|string|max:50',
            'reference_contacts.*.email' => 'nullable|email|max:255',
            'emergency_contact_name' => 'required|string|max:100',
            'emergency_contact_phone' => 'required|string|max:20',
            'emergency_contact_relationship' => 'required|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $client = auth('client')->user();
            $client->update($validator->validated());
            
            $this->updateKycStatus($client);

            return response()->json([
                'success' => true,
                'message' => 'Contact information updated successfully',
                'data' => [
                    'client' => $client->fresh(),
                    'kyc_completion' => $client->getKycCompletionPercentage(),
                    'next_step' => $this->getNextKycStep($client)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update contact information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload KYC documents
     * Story 3.6: Document Upload and Verification
     */
    public function uploadDocuments(DocumentUploadRequest $request)
    {
        try {
            $client = auth('client')->user();
            $uploadedFiles = [];

            $documentTypes = [
                'id_document_front' => 'id_document_front_path',
                'id_document_back' => 'id_document_back_path',
                'business_license' => 'business_license_path',
                'profile_photo' => 'profile_photo_path'
            ];

            foreach ($documentTypes as $inputName => $fieldName) {
                if ($request->hasFile($inputName)) {
                    $file = $request->file($inputName);
                    $fileName = $client->client_code . '_' . $inputName . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('kyc_documents/' . $client->client_code, $fileName, 'public');
                    
                    $client->update([$fieldName => $path]);
                    $uploadedFiles[] = $inputName;
                }
            }

            // Update document submission timestamp
            $client->update([
                'documents_submitted_at' => now(),
                'document_verification_status' => 'pending'
            ]);

            $this->updateKycStatus($client);

            return response()->json([
                'success' => true,
                'message' => 'Documents uploaded successfully',
                'data' => [
                    'uploaded_documents' => $uploadedFiles,
                    'client' => $client->fresh(),
                    'kyc_completion' => $client->getKycCompletionPercentage(),
                    'next_step' => $this->getNextKycStep($client)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer KYC status and progress
     */
    public function getKycStatus()
    {
        try {
            $client = auth('client')->user();

            return response()->json([
                'success' => true,
                'data' => [
                    'client' => $client,
                    'kyc_status' => $client->kyc_status,
                    'eligibility_status' => $client->eligibility_status,
                    'completion_percentage' => $client->getKycCompletionPercentage(),
                    'has_required_documents' => $client->hasRequiredDocuments(),
                    'documents_verified' => $client->documentsAreVerified(),
                    'has_gps_coordinates' => $client->hasGpsCoordinates(),
                    'next_step' => $this->getNextKycStep($client),
                    'required_steps' => [
                        'personal_information' => $client->getKycCompletionPercentage() > 70,
                        'contact_information' => !empty($client->reference_contacts),
                        'document_upload' => $client->hasRequiredDocuments(),
                        'verification_pending' => $client->document_verification_status === 'pending',
                        'kyc_approved' => $client->isKycApproved()
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get KYC status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit KYC for review
     */
    public function submitForReview()
    {
        try {
            $client = auth('client')->user();

            // Validate that all required information is provided
            if ($client->getKycCompletionPercentage() < 90) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please complete all required information before submitting for review',
                    'required_completion' => 90,
                    'current_completion' => $client->getKycCompletionPercentage()
                ], 400);
            }

            if (!$client->hasRequiredDocuments()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please upload required documents before submitting for review'
                ], 400);
            }

            $client->update([
                'kyc_status' => 'under_review',
                'kyc_completed_at' => now()
            ]);

            // TODO: Trigger notification to admin for review

            return response()->json([
                'success' => true,
                'message' => 'KYC submitted for review successfully',
                'data' => [
                    'client' => $client->fresh(),
                    'estimated_review_time' => '24-48 hours'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit KYC for review',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Private helper methods
     */
    private function updateKycStatus($client)
    {
        $completion = $client->getKycCompletionPercentage();
        
        if ($completion >= 90 && $client->hasRequiredDocuments()) {
            $client->update(['kyc_status' => 'under_review']);
        } elseif ($completion >= 50) {
            $client->update(['kyc_status' => 'pending']);
        }
    }

    private function getNextKycStep($client)
    {
        if ($client->getKycCompletionPercentage() < 70) {
            return 'personal_information';
        }
        
        if (empty($client->reference_contacts)) {
            return 'contact_information';
        }
        
        if (!$client->hasRequiredDocuments()) {
            return 'document_upload';
        }
        
        if ($client->kyc_status === 'pending') {
            return 'submit_for_review';
        }
        
        if ($client->kyc_status === 'under_review') {
            return 'awaiting_approval';
        }
        
        return 'completed';
    }
}
