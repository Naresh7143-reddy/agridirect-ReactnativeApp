# Test Backend Location API

## How to Check What Backend is Sending

### Method 1: Check React Native Logs (Easiest)

1. **Open the app and navigate to any order**
2. **Open React Native debugger console**
   - Metro Bundler console
   - Or React Native Debugger
   - Or `adb logcat` for Android
   - Or Xcode console for iOS

3. **Look for the debug output:**
   ```
   ==================================================
   📍 LOCATION DATA DEBUG REPORT
   ==================================================
   Order ID: 507f1f77bcf86cd799439011
   Order Number: ORD-20260812-0042
   
   📦 DELIVERY ADDRESS:
     Type: object
     Has lat? ❌
     Has lng? ❌
     Raw: {
       "line1": "123 Test Street",
       "city": "Chennai",
       "state": "Tamil Nadu",
       "pincode": "600001"
     }
   
   🚜 FARMER LOCATION:
     Items count: 1
     Has coordinates? ❌
     Raw first item: {
       "id": "item-001",
       "productName": "Tomatoes",
       "farmerName": "Ramesh"
     }
   
   📋 SUMMARY:
     Delivery Coords: ❌
     Farmer Coords: ❌
   
   💡 RECOMMENDATION:
      🔴 BACKEND ISSUE: No location coordinates found.
   ==================================================
   ```

### Method 2: Direct API Test (Advanced)

Use this curl command to test the backend API directly:

```bash
# Replace with your actual access token and order ID
curl -X GET \
  'https://agridirect-backend-80yz.onrender.com/api/buyer/orders/YOUR_ORDER_ID' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json'
```

### Method 3: Using Postman

1. **Create new GET request:**
   ```
   GET https://agridirect-backend-80yz.onrender.com/api/buyer/orders/{orderId}
   ```

2. **Add headers:**
   ```
   Authorization: Bearer <your_token>
   Content-Type: application/json
   ```

3. **Send request and check response**

---

## Expected Response Format (With Location Data)

### ✅ Correct Response (Has Location):

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-20260812-0042",
    "status": "PENDING",
    "deliveryAddress": {
      "label": "Home",
      "line1": "123 Anna Nagar",
      "line2": "2nd Street",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600040",
      "lat": 13.0827,          // ✅ HAS THIS
      "lng": 80.2707           // ✅ HAS THIS
    },
    "items": [
      {
        "id": "item-001",
        "productId": "prod-001",
        "productName": "Organic Tomatoes",
        "quantity": 5,
        "unit": "kg",
        "pricePerUnit": 40,
        "total": 200,
        "farmerId": "farmer-001",
        "farmerName": "Ramesh Kumar",
        "farmerLat": 13.0950,  // ✅ HAS THIS
        "farmerLng": 80.2000   // ✅ HAS THIS
      }
    ],
    "buyerId": "buyer-001",
    "buyerName": "Priya Sharma",
    "totalAmount": 200,
    "deliveryFee": 30,
    "grandTotal": 230,
    "createdAt": "2026-08-12T10:30:00.000Z"
  }
}
```

### ❌ Current Response (Missing Location):

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-20260812-0042",
    "status": "PENDING",
    "deliveryAddress": {
      "label": "Home",
      "line1": "123 Anna Nagar",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600040"
      // ❌ MISSING: "lat": 13.0827
      // ❌ MISSING: "lng": 80.2707
    },
    "items": [
      {
        "id": "item-001",
        "productName": "Organic Tomatoes",
        "quantity": 5,
        "farmerId": "farmer-001",
        "farmerName": "Ramesh Kumar"
        // ❌ MISSING: "farmerLat": 13.0950
        // ❌ MISSING: "farmerLng": 80.2000
      }
    ]
  }
}
```

---

## In-App Location Status Indicators

The app now shows visual indicators on the map:

### ✅ When Backend Sends Location Data:
- Map shows actual locations
- No warning banner
- Debug info (in dev mode): "✅✅" (both checkmarks)

### ⚠️ When Backend Missing Partial Data:
- Yellow warning banner: "⚠️ Pickup location unavailable" or "⚠️ Delivery location unavailable"
- Map uses fallback for missing data
- Debug info: "✅❌" or "❌✅"

### ❌ When Backend Missing All Location Data:
- Yellow warning banner: "⚠️ Using demo locations (Backend not sending coordinates)"
- Map uses all fallback coordinates (Chennai defaults)
- Debug info: "❌❌"

---

## Backend Database Query to Check

If you have database access, run this query to check if location data exists:

### MongoDB:
```javascript
db.orders.findOne(
  { orderNumber: "ORD-20260812-0042" },
  { 
    "deliveryAddress.lat": 1,
    "deliveryAddress.lng": 1,
    "items.farmerLat": 1,
    "items.farmerLng": 1
  }
)
```

### Expected result if data exists:
```json
{
  "deliveryAddress": {
    "lat": 13.0827,
    "lng": 80.2707
  },
  "items": [
    {
      "farmerLat": 13.0950,
      "farmerLng": 80.2000
    }
  ]
}
```

---

## Quick Fix for Backend (If Data is Missing)

### Option 1: Add Static Test Data (Quick Test)

```javascript
// In your backend order controller
router.get('/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  // TEMPORARY: Add test coordinates for debugging
  if (order.deliveryAddress && !order.deliveryAddress.lat) {
    order.deliveryAddress.lat = 13.0827;
    order.deliveryAddress.lng = 80.2707;
  }
  
  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      if (!item.farmerLat) {
        item.farmerLat = 13.0950;
        item.farmerLng = 80.2000;
      }
    });
  }
  
  res.json({ success: true, data: order });
});
```

### Option 2: Add Real Geocoding (Production Solution)

```javascript
// When creating/updating order
const geocodeAddress = async (address) => {
  const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: {
      address: `${address.line1}, ${address.city}, ${address.state} ${address.pincode}`,
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });
  
  if (response.data.results[0]) {
    const location = response.data.results[0].geometry.location;
    return {
      ...address,
      lat: location.lat,
      lng: location.lng
    };
  }
  
  return address;
};

// When creating order
order.deliveryAddress = await geocodeAddress(orderInput.deliveryAddress);
```

---

## Verification Steps

1. ✅ Open any order in the app
2. ✅ Check React Native logs for the debug report
3. ✅ Look at the map for the warning banner
4. ✅ Check the recommendation in the debug report
5. ✅ Test backend API directly with curl/Postman

---

## Contact Backend Team

Send them this information:

**Issue:** Maps showing fallback locations instead of real data

**Missing Fields:**
- `deliveryAddress.lat` (number)
- `deliveryAddress.lng` (number)
- `items[].farmerLat` (number)
- `items[].farmerLng` (number)

**API Endpoint:** `GET /api/buyer/orders/:id`

**Expected Response:** See "Expected Response Format" section above

**Debug Report:** Copy the console output from React Native logs
