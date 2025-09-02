# M-Pesa C2B Simulation Testing Guide

## 🚀 Testing Your M-Pesa C2B Integration

### 1. Simulate a Payment (Triggers Safaricom to call your confirmation URL)

**Endpoint:** `POST https://99d1a75aa1f4.ngrok-free.app/api/sts/simulate-payment`

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Body (JSON):**
```json
{
    "amount": 1000,
    "msisdn": "254708374149",
    "bill_ref_number": "DEVICE001"
}
```

**Expected Response:**
```json
{
    "success": true,
    "message": "C2B payment simulation initiated successfully",
    "data": {
        "amount": 1000,
        "msisdn": "254708374149",
        "bill_ref_number": "DEVICE001",
        "safaricom_response": {
            "ConversationID": "...",
            "OriginatorConversationID": "...",
            "ResponseCode": "0",
            "ResponseDescription": "Accept the service request successfully."
        },
        "note": "Check your confirmation endpoint for the payment callback"
    }
}
```

### 2. View Recent Transactions

**Endpoint:** `GET https://99d1a75aa1f4.ngrok-free.app/api/sts/recent-transactions`

**Headers:**
```
Accept: application/json
```

**Expected Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "trans_id": "LGR019G3J2",
            "amount": "1000.00",
            "msisdn": "254708374149",
            "customer_name": "John  Doe",
            "device_id": "DEVICE001",
            "payment_status": "received",
            "verification_status": "pending",
            "created_at": "2025-01-26 10:30:45"
        }
    ],
    "total": 1
}
```

### 3. Test Parameters

#### Valid Phone Numbers (Kenya format):
- `254708374149` - Valid test number
- `254712345678` - Valid test number
- `254700000000` - Safaricom test number

#### Valid Amounts:
- Minimum: `1` (KSh 1)
- Maximum: `70000` (KSh 70,000 for sandbox)
- Recommended test amounts: `10`, `100`, `500`, `1000`

#### Bill Reference Numbers:
- Use your device/customer IDs: `DEVICE001`, `KY000001`, `CLIENT123`
- Max length: 20 characters
- Alphanumeric characters only

### 4. Testing Flow

1. **First, simulate a payment:**
   ```bash
   POST /api/sts/simulate-payment
   ```

2. **Safaricom will automatically call your confirmation URL:**
   ```bash
   POST /api/sts/confirmation
   ```

3. **Check if transaction was saved:**
   ```bash
   GET /api/sts/recent-transactions
   ```

### 5. Error Handling Test Cases

#### Invalid Phone Number:
```json
{
    "amount": 100,
    "msisdn": "0708374149",  // Should start with 254
    "bill_ref_number": "DEVICE001"
}
```

#### Invalid Amount:
```json
{
    "amount": 0,  // Should be > 0
    "msisdn": "254708374149",
    "bill_ref_number": "DEVICE001"
}
```

#### Missing Fields:
```json
{
    "amount": 100
    // Missing msisdn and bill_ref_number
}
```

### 6. Postman Collection

Create a Postman collection with these requests:

1. **Simulate Payment** - POST request with JSON body
2. **Get Recent Transactions** - GET request 
3. **Test Confirmation Endpoint** - POST request (for manual testing)

### 7. Monitoring

Check your Laravel logs for detailed information:
```bash
tail -f storage/logs/laravel.log
```

Look for entries like:
- `Initiating C2B Payment Simulation`
- `C2B Simulation Response`
- `C2B Transaction received`

### 8. Expected Workflow

1. You call `/simulate-payment` → Returns success
2. Safaricom calls `/payment/confirmation` → Your endpoint saves transaction
3. You call `/recent-transactions` → See the saved transaction

This simulates the real PayBill flow where customers send money to your PayBill number and Safaricom notifies your system. 