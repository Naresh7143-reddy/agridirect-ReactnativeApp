/**
 * Location Data Debugging Utility
 * 
 * Use this to diagnose if backend is sending location coordinates
 */

import { Order } from '../types/order';

export interface LocationDebugInfo {
  hasDeliveryCoordinates: boolean;
  hasFarmerCoordinates: boolean;
  deliveryAddress: {
    type: 'object' | 'string' | 'null';
    hasLat: boolean;
    hasLng: boolean;
    lat?: number;
    lng?: number;
    raw: any;
  };
  farmerLocation: {
    hasData: boolean;
    itemsCount: number;
    firstItemHasCoordinates: boolean;
    farmerLat?: number;
    farmerLng?: number;
    raw: any;
  };
  recommendation: string;
}

export function debugOrderLocation(order: Order | null): LocationDebugInfo {
  if (!order) {
    return {
      hasDeliveryCoordinates: false,
      hasFarmerCoordinates: false,
      deliveryAddress: {
        type: 'null',
        hasLat: false,
        hasLng: false,
        raw: null,
      },
      farmerLocation: {
        hasData: false,
        itemsCount: 0,
        firstItemHasCoordinates: false,
        raw: null,
      },
      recommendation: 'Order is null or undefined',
    };
  }

  const deliveryAddr = order.deliveryAddress;
  const firstItem = order.items?.[0];

  const deliveryAddressInfo = {
    type: typeof deliveryAddr === 'object' && deliveryAddr !== null ? 'object' : 
          typeof deliveryAddr === 'string' ? 'string' : 'null',
    hasLat: typeof deliveryAddr === 'object' && deliveryAddr !== null && 'lat' in deliveryAddr && typeof deliveryAddr.lat === 'number',
    hasLng: typeof deliveryAddr === 'object' && deliveryAddr !== null && 'lng' in deliveryAddr && typeof deliveryAddr.lng === 'number',
    lat: typeof deliveryAddr === 'object' && deliveryAddr !== null ? (deliveryAddr as any).lat : undefined,
    lng: typeof deliveryAddr === 'object' && deliveryAddr !== null ? (deliveryAddr as any).lng : undefined,
    raw: deliveryAddr,
  } as const;

  const farmerLocationInfo = {
    hasData: !!firstItem,
    itemsCount: order.items?.length || 0,
    firstItemHasCoordinates: !!(firstItem && (firstItem as any).farmerLat && (firstItem as any).farmerLng),
    farmerLat: (firstItem as any)?.farmerLat,
    farmerLng: (firstItem as any)?.farmerLng,
    raw: firstItem,
  };

  let recommendation = '';
  const hasDeliveryCoordinates = deliveryAddressInfo.hasLat && deliveryAddressInfo.hasLng;
  const hasFarmerCoordinates = farmerLocationInfo.firstItemHasCoordinates;

  if (!hasDeliveryCoordinates && !hasFarmerCoordinates) {
    recommendation = '🔴 BACKEND ISSUE: No location coordinates found. Backend needs to add lat/lng to deliveryAddress and farmerLat/farmerLng to order items.';
  } else if (!hasDeliveryCoordinates) {
    recommendation = '🟡 PARTIAL DATA: Farmer location found, but delivery address missing coordinates. Backend needs to add lat/lng to deliveryAddress.';
  } else if (!hasFarmerCoordinates) {
    recommendation = '🟡 PARTIAL DATA: Delivery address found, but farmer location missing. Backend needs to add farmerLat/farmerLng to order items.';
  } else {
    recommendation = '✅ ALL GOOD: Both delivery and farmer coordinates are present.';
  }

  return {
    hasDeliveryCoordinates,
    hasFarmerCoordinates,
    deliveryAddress: deliveryAddressInfo,
    farmerLocation: farmerLocationInfo,
    recommendation,
  };
}

export function logLocationDebugInfo(order: Order | null, orderId: string) {
  const debug = debugOrderLocation(order);
  
  console.log('\n='.repeat(50));
  console.log('📍 LOCATION DATA DEBUG REPORT');
  console.log('='.repeat(50));
  console.log('Order ID:', orderId);
  console.log('Order Number:', order?.orderNumber || 'N/A');
  console.log('\n📦 DELIVERY ADDRESS:');
  console.log('  Type:', debug.deliveryAddress.type);
  console.log('  Has lat?', debug.deliveryAddress.hasLat ? '✅' : '❌');
  console.log('  Has lng?', debug.deliveryAddress.hasLng ? '✅' : '❌');
  if (debug.deliveryAddress.hasLat && debug.deliveryAddress.hasLng) {
    console.log('  Coordinates:', `${debug.deliveryAddress.lat}, ${debug.deliveryAddress.lng}`);
  }
  console.log('  Raw:', JSON.stringify(debug.deliveryAddress.raw, null, 2));
  
  console.log('\n🚜 FARMER LOCATION:');
  console.log('  Items count:', debug.farmerLocation.itemsCount);
  console.log('  Has coordinates?', debug.farmerLocation.firstItemHasCoordinates ? '✅' : '❌');
  if (debug.farmerLocation.firstItemHasCoordinates) {
    console.log('  Coordinates:', `${debug.farmerLocation.farmerLat}, ${debug.farmerLocation.farmerLng}`);
  }
  console.log('  Raw first item:', JSON.stringify(debug.farmerLocation.raw, null, 2));
  
  console.log('\n📋 SUMMARY:');
  console.log('  Delivery Coords:', debug.hasDeliveryCoordinates ? '✅' : '❌');
  console.log('  Farmer Coords:', debug.hasFarmerCoordinates ? '✅' : '❌');
  console.log('\n💡 RECOMMENDATION:');
  console.log('  ', debug.recommendation);
  console.log('='.repeat(50) + '\n');
  
  return debug;
}

export function getLocationSummary(order: Order | null): string {
  const debug = debugOrderLocation(order);
  
  if (debug.hasDeliveryCoordinates && debug.hasFarmerCoordinates) {
    return '✅ Using real locations';
  } else if (!debug.hasDeliveryCoordinates && !debug.hasFarmerCoordinates) {
    return '❌ Using demo locations (no backend data)';
  } else {
    return '⚠️ Using partial real data + fallbacks';
  }
}
