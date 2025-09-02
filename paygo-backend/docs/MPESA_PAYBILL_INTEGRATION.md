# M-Pesa PayBill Integration - KOYO PayGo Platform

## 📋 **Overview**

The KOYO PayGo platform integrates with M-Pesa PayBill to enable customers to make installment payments for their appliances directly from their mobile phones. This document explains the complete integration flow according to **official M-Pesa specifications**.

## 🔄 **M-Pesa PayBill Process Flow**

### **1. Customer Payment Initiation**
- Customer dials `*150*00#` or uses M-Pesa app
- Selects "Pay Bill" option
- Enters:
  - **Business Number**: `174379` (KOYO PayGo)
  - **Account Number**: Their device ID (e.g., `KY123456`)
  - **Amount**: The installment amount (e.g., `1500`)

### **2. M-Pesa Internal Validation**
- M-Pesa receives the payment request
- Performs internal validation (phone number, amount format, etc.)
- Checks if **External Validation** is enabled for business `174379`

### **3. External Validation (Our System)**
**IF External Validation is enabled:**
- M-Pesa sends POST request to our **Validation URL**: `/api/paybill/validation`
- Our system validates:
  - ✅ Business number matches `174379`
  - ✅ Device ID exists in our system
  - ✅ Amount matches expected installment amount
- We respond with:
  - **Accept**: `{"ResultCode": "0", "ResultDesc": "Accepted"}`
  - **Reject**: `{"ResultCode": "C2B00011", "ResultDesc": "Rejected"}`

### **4. Payment Completion**
**If validation accepted:**
- M-Pesa completes the payment transaction
- Money is transferred to KOYO PayGo account
- M-Pesa sends POST request to our **Confirmation URL**: `/api/paybill/confirmation`
- Our system processes the payment automatically

**If validation rejected:**
- M-Pesa cancels the transaction
- No money is transferred
- Customer receives rejection SMS

### **5. Automatic Processing**
Once confirmation is received:
- ✅ Payment is recorded in database
- ✅ Customer's payment plan is updated
- ✅ IoT device status may be updated
- ✅ SMS notifications are sent
- ✅ Client dashboard shows updated status **in real-time**

## 🛠️ **Technical Implementation**

### **Validation Endpoint**
```php
POST /api/paybill/validation

// M-Pesa Request Format:
{
    "TransactionType": "Pay Bill",
    "TransID": "RKTQDM7W6S",
    "TransTime": "20191122063845",
    "TransAmount": "1500",
    "BusinessShortCode": "174379",
    "BillRefNumber": "KY123456",  // Device ID
    "InvoiceNumber": "",
    "OrgAccountBalance": "",
    "ThirdPartyTransID": "",
    "MSISDN": "254712345678",
    "FirstName": "John",
    "MiddleName": "",
    "LastName": "Doe"
}

// Our Response (Accept):
{
    "ResultCode": "0",
    "ResultDesc": "Accepted"
}

// Our Response (Reject):
{
    "ResultCode": "C2B00012",
    "ResultDesc": "Rejected"
}
```

### **Confirmation Endpoint**
```php
POST /api/paybill/confirmation

// M-Pesa Request Format (same as validation):
{
    "TransactionType": "Pay Bill",
    "TransID": "RKTQDM7W6S",
    "TransTime": "20191122063845",
    "TransAmount": "1500",
    "BusinessShortCode": "174379",
    "BillRefNumber": "KY123456",
    // ... other fields
}

// Our Response:
{
    "ResultDesc": "Payment automatically processed and confirmed."
}
```

## 📱 **Frontend Integration**

### **PayBill Payment Modal**
The frontend PayBill modal displays:
1. **Business Information**: Name, PayBill number (174379)
2. **Payment Instructions**: 6-step process for making payment
3. **Device ID**: Auto-generated or user-entered
4. **Automatic Monitoring**: Real-time payment detection

### **Real-Time Updates**
- Uses polling mechanism to check for payments
- Polls endpoints: `/api/paybill/poll-status/{clientId}`
- Updates dashboard automatically when payment is received
- No manual "Check Payment" button needed

## 🔧 **Configuration & Setup**

### **1. M-Pesa URL Registration**
Before PayBill can work, URLs must be registered with Safaricom:

```php
POST /api/mpesa/register-urls

{
    "ShortCode": "174379",
    "ResponseType": "Completed",
    "ConfirmationURL": "https://koyo.co.ke/api/paybill/confirmation",
    "ValidationURL": "https://koyo.co.ke/api/paybill/validation"
}
```

**Important Requirements:**
- ✅ Production URLs **must be HTTPS**
- ✅ URLs must be **publicly accessible** (no ngrok in production)
- ✅ Cannot contain keywords: M-Pesa, Safaricom, SQL, etc.
- ✅ Registration is **one-time only** in production

### **2. Environment Configuration**
```env
# M-Pesa Configuration
MPESA_ENVIRONMENT=sandbox
MPESA_C2B_SHORTCODE=174379
MPESA_C2B_RESPONSE_TYPE=Completed
MPESA_BUSINESS_NAME="KOYO PayGo Platform"

# URLs (must be HTTPS in production)
MPESA_C2B_VALIDATION_URL=https://koyo.co.ke/api/paybill/validation
MPESA_C2B_CONFIRMATION_URL=https://koyo.co.ke/api/paybill/confirmation

# PayGo Settings
MPESA_REQUIRE_EXACT_AMOUNT=true
MPESA_SEND_SMS_NOTIFICATIONS=true
```

## 🎯 **Business Logic**

### **Validation Rules**
1. **Business Number**: Must be exactly `174379`
2. **Device ID**: Must exist in our appliance database
3. **Amount**: Must match expected installment amount exactly
4. **Customer**: Phone number validation (optional)

### **Payment Types**
- **Down Payment**: First payment for new appliance order
- **Installment**: Recurring payment for active payment plan
- **Final Payment**: Last installment to complete payment plan

### **Error Handling**
| Error Code | Description | Action |
|------------|-------------|---------|
| `0` | Success | Accept payment |
| `C2B00011` | Invalid phone number | Reject |
| `C2B00012` | Invalid device ID | Reject |
| `C2B00013` | Invalid amount | Reject |
| `C2B00015` | Invalid business number | Reject |
| `C2B00016` | System error | Reject |

## 🚀 **Automatic Features**

### **Zero Manual Intervention**
- ✅ Customer makes payment from phone
- ✅ System validates automatically
- ✅ Payment is processed instantly
- ✅ Dashboard updates in real-time
- ✅ Notifications sent automatically

### **Real-Time Dashboard**
- Polls for new transactions every 10 seconds
- Shows payment status immediately
- Displays transaction details
- Updates payment plan progress

### **Smart Validation**
- Checks device ownership
- Validates expected payment amounts
- Handles overpayments and underpayments
- Prevents duplicate payments

## 🔍 **Testing & Debugging**

### **Test Endpoints**
```bash
# Test validation endpoint
curl -X POST https://koyo.co.ke/api/paybill/validation \
  -H "Content-Type: application/json" \
  -d '{}'

# Test confirmation endpoint  
curl -X POST https://koyo.co.ke/api/paybill/confirmation \
  -H "Content-Type: application/json" \
  -d '{}'

# Check registration status
curl https://koyo.co.ke/api/mpesa/registration-status
```

### **Simulation**
```php
POST /api/paybill/simulate

{
    "device_id": "KY123456",
    "amount": 1500,
    "phone": "254712345678",
    "customer_name": "John Doe"
}
```

## 📊 **Monitoring & Analytics**

### **Transaction Analytics**
- Daily/Monthly payment volumes
- Success/failure rates
- Payment completion times
- Customer payment patterns

### **Reconciliation**
- Compare received callbacks with M-Pesa statements
- Identify missing transactions
- Handle failed confirmations

### **Logs**
```bash
# View M-Pesa validation logs
tail -f storage/logs/laravel.log | grep "M-Pesa C2B Paybill Validation"

# View confirmation logs
tail -f storage/logs/laravel.log | grep "M-Pesa C2B Paybill Confirmation"

# View CORS debugging
tail -f storage/logs/laravel.log | grep "CORS Debug"
```

## ⚠️ **Important Notes**

1. **Production URLs**: Must be HTTPS and publicly accessible
2. **One-Time Registration**: URLs can only be registered once in production
3. **Response Time**: Validation must respond within 8 seconds
4. **Default Action**: Set to "Completed" for automatic processing
5. **Error Codes**: Use standard M-Pesa error codes for consistency
6. **Reconciliation**: Always cross-check with M-Pesa portal for missing transactions

## 🔗 **Useful Links**

- [M-Pesa C2B API Documentation](https://developer.safaricom.co.ke/docs/c2b-api)
- [M-Pesa Org Portal](https://org.ke.m-pesa.com/)
- [Safaricom API Support](mailto:apisupport@safaricom.co.ke)

---

**KOYO PayGo Platform** - Automatic M-Pesa PayBill Integration 🚀 