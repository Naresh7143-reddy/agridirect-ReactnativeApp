# Real Location Data Integration - Backend Requirements

## ✅ Changes Made

I've updated all map components to use **real location data from the order object** instead of hardcoded coordinates.

### Files Updated:
1. ✅ `src/screens/buyer/OrderDetailScreen.tsx` - Uses real order locations
2. ✅ `src/screens/farmer/FarmerOrderDetailScreen.tsx` - Uses real order locations
3. ✅ `src/screens/buyer/OrderTrackingScreen.tsx` - Uses real order locations

---

## 📍 Location Data Structure Required from Backend

### Order Object Structure

Your backend API should return order objects with the following location data:

```typescript
interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  
  // 🔴 CRITICAL: Delivery Address with Coordinates
  deliveryAddress: {
    label?: string;        // "Home", "Office", etc.
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    lat: number;          // ⚠️ REQUIRED for map
    lng: number;          // ⚠️ REQUIRED for map
  };
  
  // 🔴 CRITICAL: Items with Farmer Location
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    farmerId: string;
    farmerName: string;
    farmerLat?: number;   // ⚠️ REQUIRED for pickup location
    farmerLng?: number;   // ⚠️ REQUIRED for pickup location
  }>;
  
  // Optional: Driver/Agent Live Location (for tracking)
  driverLat?: number;     // Real-time driver latitude
  driverLng?: number;     // Real-time driver longitude
  
  // Optional: Farm Location (alternative to item.farmerLat/Lng)
  farmLat?: number;
  farmLng?: number;
  
  // Optional: Vehicle Type
  requiredVehicleType?: 'BIKE' | 'VAN' | 'TRUCK' | 'AUTO' | 'SCOOTER';
  
  // ... other order fields
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  totalAmount: number;
  deliveryFee: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🗺️ How Location Data is Used

### 1. **Pickup Location (Farm/Farmer)**
**Priority Order:**
1. `order.items[0].farmerLat` and `order.items[0].farmerLng` (from first item)
2. `order.farmLat` and `order.farmLng` (order-level farm location)
3. **Fallback:** `13.085, 80.265` (Chennai default - only if no data)

```typescript
// Current Implementation:
const pickupLat = order.items?.[0]?.farmerLat || order.farmLat || 13.085;
const pickupLng = order.items?.[0]?.farmerLng || order.farmLng || 80.265;
```

### 2. **Dropoff Location (Buyer Address)**
**Priority Order:**
1. `order.deliveryAddress.lat` and `order.deliveryAddress.lng`
2. **Fallback:** `13.075, 80.28` (Chennai default - only if no data)

```typescript
// Current Implementation:
const deliveryAddr = typeof order.deliveryAddress === 'object' ? order.deliveryAddress : null;
const dropLat = deliveryAddr?.lat || 13.075;
const dropLng = deliveryAddr?.lng || 80.28;
```

### 3. **Driver Location (Real-time Tracking)**
**Priority Order:**
1. `agent.lat` and `agent.lng` (from live tracking API: `/api/buyer/orders/:id/agent-location`)
2. `order.driverLat` and `order.driverLng` (if embedded in order)
3. **Fallback:** `13.082, 80.272` (Mid-point default - only if no data)

```typescript
// Current Implementation:
const driverLat = agent?.lat || order?.driverLat || 13.082;
const driverLng = agent?.lng || order?.driverLng || 80.272;
```

---

## 🔧 Backend Implementation Guide

### Step 1: Add Coordinates to Delivery Address

When creating/updating an order, geocode the delivery address to get lat/lng:

```javascript
// Example using Google Maps Geocoding API or similar
async function geocodeAddress(address) {
  const fullAddress = `${address.line1}, ${address.city}, ${address.state} ${address.pincode}`;
  const geocoded = await geocodingService.geocode(fullAddress);
  
  return {
    ...address,
    lat: geocoded.latitude,
    lng: geocoded.longitude
  };
}

// When creating order
order.deliveryAddress = await geocodeAddress(addressInput);
```

### Step 2: Add Farmer Location to Order Items

Store farmer's location in their profile and include it in order items:

```javascript
// Farmer Profile Schema
const farmerSchema = {
  _id: ObjectId,
  name: String,
  phone: String,
  farmLocation: {
    latitude: Number,    // ⚠️ Add this
    longitude: Number,   // ⚠️ Add this
    address: String
  },
  // ... other fields
};

// When creating order item
async function createOrderItem(productId, farmerId) {
  const farmer = await Farmer.findById(farmerId);
  const product = await Product.findById(productId);
  
  return {
    productId: product._id,
    productName: product.name,
    farmerId: farmer._id,
    farmerName: farmer.name,
    farmerLat: farmer.farmLocation?.latitude,    // ⚠️ Include this
    farmerLng: farmer.farmLocation?.longitude,   // ⚠️ Include this
    // ... other item fields
  };
}
```

### Step 3: Real-time Driver Location Tracking

Implement the agent location endpoint:

```javascript
// GET /api/buyer/orders/:orderId/agent-location
app.get('/api/buyer/orders/:orderId/agent-location', async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  
  if (!order.deliveryAgentId) {
    return res.json({ available: false });
  }
  
  // Get agent's real-time location from tracking system
  const agent = await DeliveryAgent.findById(order.deliveryAgentId);
  const liveLocation = await getAgentLiveLocation(agent._id);
  
  res.json({
    available: true,
    lat: liveLocation.latitude,
    lng: liveLocation.longitude,
    status: agent.currentStatus,
    agentName: agent.name,
    agentPhone: agent.phone,
    vehicleType: agent.vehicleType,
    vehicleRegistration: agent.vehicleNumber,
    rating: agent.rating,
    totalDeliveries: agent.totalDeliveries
  });
});
```

---

## 📊 Example API Response

### Order Detail API Response (with location data)

```json
{
  "id": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-20260812-0042",
  "status": "IN_TRANSIT",
  "deliveryAddress": {
    "label": "Home",
    "line1": "123 Anna Nagar",
    "line2": "2nd Street",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": "600040",
    "lat": 13.0827,
    "lng": 80.2707
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
      "farmerLat": 13.0950,
      "farmerLng": 80.2000
    }
  ],
  "requiredVehicleType": "BIKE",
  "buyerId": "buyer-001",
  "buyerName": "Priya Sharma",
  "buyerPhone": "+91 9876543210",
  "totalAmount": 200,
  "deliveryFee": 30,
  "grandTotal": 230,
  "paymentMethod": "RAZORPAY",
  "paymentStatus": "PAID",
  "createdAt": "2026-08-12T10:30:00.000Z",
  "updatedAt": "2026-08-12T11:15:00.000Z"
}
```

### Agent Location API Response

```json
{
  "available": true,
  "lat": 13.0850,
  "lng": 80.2350,
  "status": "IN_TRANSIT",
  "agentName": "Vijay Kumar",
  "agentPhone": "+91 9988776655",
  "vehicleType": "BIKE",
  "vehicleRegistration": "TN01AB1234",
  "rating": 4.8,
  "totalDeliveries": 243
}
```

---

## 🚀 Testing Guide

### Test with Real Data:

1. **Create Order with Location Data:**
   ```javascript
   {
     deliveryAddress: {
       line1: "123 Test Street",
       city: "Chennai",
       state: "Tamil Nadu",
       pincode: "600001",
       lat: 13.0827,    // ✅ Include this
       lng: 80.2707     // ✅ Include this
     },
     items: [{
       farmerLat: 13.0950,  // ✅ Include this
       farmerLng: 80.2000   // ✅ Include this
     }]
   }
   ```

2. **Open Order Detail Screen:**
   - Map should show pickup location at farmer's coordinates
   - Map should show dropoff location at buyer's coordinates

3. **Open Order Tracking Screen:**
   - Map should show driver moving in real-time
   - Route should connect pickup → driver → dropoff

### Fallback Behavior:

If coordinates are missing:
- ✅ App still works (uses Chennai defaults)
- ⚠️ Console warning appears: "Using fallback coordinates"
- ⚠️ Map shows default Chennai locations

---

## 🎯 Migration Strategy

### Phase 1: Add Location Fields (No Breaking Changes)
1. Add `lat`/`lng` to deliveryAddress schema (optional)
2. Add `farmerLat`/`farmerLng` to order items schema (optional)
3. Update order creation to include these fields
4. Frontend uses fallback for old orders without coordinates

### Phase 2: Make Location Required
1. Backfill existing orders with geocoded coordinates
2. Make location fields required in schema
3. Remove fallback coordinates from frontend

### Phase 3: Real-time Tracking
1. Implement delivery agent location tracking
2. Update `/agent-location` endpoint every 5-10 seconds
3. Store location history for delivery tracking

---

## 📝 Checklist for Backend Team

### Immediate (Required for Maps to Work):

- [ ] Add `lat` and `lng` fields to `deliveryAddress` schema
- [ ] Add `farmerLat` and `farmerLng` fields to order items
- [ ] Implement geocoding for delivery addresses
- [ ] Store farmer location in farmer profile
- [ ] Include farmer location in order items when creating order

### Soon (For Real-time Tracking):

- [ ] Implement delivery agent location tracking system
- [ ] Create `/api/buyer/orders/:id/agent-location` endpoint
- [ ] Update agent location every 5-10 seconds
- [ ] Add `driverLat`/`driverLng` to order object

### Later (Nice to Have):

- [ ] Store location history for delivery analytics
- [ ] Add geofencing for pickup/delivery confirmation
- [ ] Calculate optimal routes using Google Maps Directions API
- [ ] Estimate accurate ETAs based on traffic

---

## 🆘 Support

### If Maps Show Wrong Locations:

1. Check if order has real coordinates:
   ```javascript
   console.log('Delivery Address:', order.deliveryAddress);
   console.log('Farmer Location:', order.items[0].farmerLat, order.items[0].farmerLng);
   ```

2. Verify coordinates are valid:
   - Latitude should be between -90 and 90
   - Longitude should be between -180 and 180
   - For India: lat ~8-35, lng ~68-97

3. Check console warnings:
   - "Using fallback coordinates" = Backend not sending coordinates
   - No warnings = Coordinates are being used

---

**Status:** ✅ Frontend Updated to Use Real Data
**Next Step:** Backend team to add location fields to API responses
**Fallback:** App still works with default Chennai coordinates until backend is updated
