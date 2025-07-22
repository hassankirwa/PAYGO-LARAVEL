# PayBill Transaction Flow Testing Guide

## 🚀 Complete PayBill Integration Test

This guide tests the complete PayBill transaction flow from M-Pesa validation to client dashboard display.

## 📋 Prerequisites

1. **Backend Setup**:
   ```bash
   cd paygo-backend
   php artisan migrate  # Ensure paybill_transactions table exists
   php artisan serve    # Start Laravel server
   ```

2. **Frontend Setup**:
   ```bash
   cd paygo-frontend
   npm run dev         # Start Next.js development server
   ```

3. **Database Requirements**:
   - Client record with ID
   - Appliance record linked to client
   - PaymentOrder or PaymentPlan for expected amounts

## 🔄 Testing Flow

### Step 1: Validation Test

**Endpoint**: `POST /api/paybill/validation`

**Test Validation Request**:
```json
{
    "TransactionType": "Pay Bill",
    "TransID": "TEST123456",
    "TransTime": "20250121120000",
    "TransAmount": "2500",
    "BusinessShortCode": "174379",
    "BillRefNumber": "KOYO_001",
    "MSISDN": "254712345678",
    "FirstName": "John",
    "LastName": "Doe"
}
```

**Expected Response**:
- ✅ `ResultCode: "0"` if all validations pass
- ❌ `ResultCode: "C2B00012"` if device not found
- ❌ `ResultCode: "C2B00013"` if amount mismatch
- ❌ `ResultCode: "C2B00015"` if wrong business number

### Step 2: Confirmation Test

**Endpoint**: `POST /api/paybill/confirmation`

**Test Confirmation Request**:
```json
{
    "TransactionType": "Pay Bill",
    "TransID": "TEST123456",
    "TransTime": "20250121120000",
    "TransAmount": "2500",
    "BusinessShortCode": "174379",
    "BillRefNumber": "KOYO_001",
    "InvoiceNumber": "",
    "OrgAccountBalance": "10000.00",
    "ThirdPartyTransID": "",
    "MSISDN": "254712345678",
    "FirstName": "John",
    "MiddleName": "",
    "LastName": "Doe"
}
```

**Expected Results**:
1. Creates record in `paybill_transactions` table
2. Updates payment order status (if exists)
3. Updates payment plan progress (if exists)
4. Creates C2B transaction record (backward compatibility)

### Step 3: Client Dashboard API Test

**Endpoints**:
```bash
# Get PayBill transactions
GET /api/client/paybill-transactions
Authorization: Bearer {client_token}

# Get transaction summary
GET /api/client/paybill-transactions/summary
Authorization: Bearer {client_token}

# Get specific transaction
GET /api/client/paybill-transactions/{id}
Authorization: Bearer {client_token}
```

**Expected Response Structure**:
```json
{
    "success": true,
    "data": {
        "transactions": [...],
        "pagination": {...}
    }
}
```

### Step 4: Frontend Integration Test

**Access**: `http://localhost:3000/client/dashboard`

**Expected UI Elements**:
1. ✅ PayBill Transactions section in dashboard
2. ✅ Transaction summary cards (totals, recent counts)
3. ✅ Filter options (status, payment type, date range)
4. ✅ Transaction list with badges and formatting
5. ✅ Transaction details modal
6. ✅ Pagination controls

## 🧪 Test Scenarios

### Scenario 1: Successful Down Payment
```json
{
    "BillRefNumber": "KOYO_001",
    "TransAmount": "25000",  // Exact down payment amount
    "MSISDN": "254712345678"
}
```
**Expected**: ✅ Accepted, payment order completed

### Scenario 2: Successful Installment
```json
{
    "BillRefNumber": "KOYO_001", 
    "TransAmount": "3250",   // Exact installment amount
    "MSISDN": "254712345678"
}
```
**Expected**: ✅ Accepted, payment plan updated

### Scenario 3: Amount Mismatch
```json
{
    "BillRefNumber": "KOYO_001",
    "TransAmount": "2000",   // Wrong amount
    "MSISDN": "254712345678"
}
```
**Expected**: ❌ Rejected with C2B00013

### Scenario 4: Device Not Found
```json
{
    "BillRefNumber": "KOYO_999",  // Non-existent device
    "TransAmount": "2500",
    "MSISDN": "254712345678"
}
```
**Expected**: ❌ Rejected with C2B00012

### Scenario 5: Wrong Business Number
```json
{
    "BusinessShortCode": "123456",  // Wrong shortcode
    "BillRefNumber": "KOYO_001",
    "TransAmount": "2500"
}
```
**Expected**: ❌ Rejected with C2B00015

## 📊 Database Verification

### Check PayBill Transactions
```sql
SELECT 
    id, trans_id, trans_amount, device_id, 
    payment_type, status, amount_matched,
    client_id, created_at
FROM paybill_transactions 
ORDER BY created_at DESC;
```

### Check Payment Processing
```sql
-- Check payment order updates
SELECT id, status, payment_completed_at 
FROM payment_orders 
WHERE status = 'completed';

-- Check payment plan updates  
SELECT id, installments_completed, total_paid_ksh, status
FROM payment_plans 
WHERE client_id = {client_id};
```

## 🎯 Success Criteria

### ✅ Backend Validation
- [x] Strict business number validation
- [x] Device existence verification
- [x] Exact amount matching
- [x] Proper error codes returned

### ✅ Backend Processing
- [x] PayBill transaction records created
- [x] Payment orders updated correctly
- [x] Payment plans updated automatically
- [x] C2B transactions created for compatibility

### ✅ API Endpoints
- [x] Client authentication required
- [x] Proper pagination and filtering
- [x] Transaction details with relationships
- [x] Summary statistics accurate

### ✅ Frontend Integration
- [x] Component loads without errors
- [x] Data displays correctly formatted
- [x] Filters and search work properly
- [x] Transaction details modal functional
- [x] Responsive design maintained

## 🔧 Troubleshooting

### Common Issues

1. **401 Unauthorized in Frontend**
   - Check `client_token` in localStorage
   - Verify Sanctum authentication

2. **Empty Transaction List**
   - Verify client_id in paybill_transactions
   - Check database relationships

3. **Amount Validation Failures**
   - Ensure exact amount matching
   - Check USD to KSh conversion (130 rate)

4. **Device Not Found Errors**
   - Verify appliance exists with correct unit_id
   - Check appliance.client_id relationship

### Debug Commands

```bash
# Check Laravel logs
tail -f paygo-backend/storage/logs/laravel.log

# Check database connection
php artisan tinker
>>> \App\Models\PaybillTransaction::count()

# Test API endpoint
curl -H "Authorization: Bearer {token}" \
     http://localhost:8000/api/client/paybill-transactions
```

## 🎉 Integration Complete!

Your PayBill transaction system now provides:

- ✅ **Strict M-Pesa validation** with official error codes
- ✅ **Automatic payment processing** with plan updates  
- ✅ **Comprehensive client dashboard** with transaction history
- ✅ **Real-time transaction tracking** with detailed views
- ✅ **Complete audit trail** from validation to confirmation

The system ensures every PayBill payment is validated against your PayGo platform requirements and processed seamlessly for your clients! 