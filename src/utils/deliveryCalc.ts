/**
 * Utility functions for dynamic ETA calculation and delivery earnings calculation.
 */

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateDistanceKm(
  origin: LocationCoords,
  destination: LocationCoords,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;
  const dLon = ((destination.longitude - origin.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.latitude * Math.PI) / 180) *
      Math.cos((destination.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.max(0.8, Math.round(distance * 10) / 10);
}

/**
 * Dynamically computes Estimated Time of Arrival (ETA) in minutes.
 * Combines prep time (based on item count) + transit time (based on distance).
 */
export function calculateDynamicEta(
  distanceKm: number = 3.5,
  itemCount: number = 2,
): { minutes: number; formatted: string; arrivalTimeStr: string } {
  const prepTimeMins = 8 + Math.min(itemCount * 2, 15);
  const travelMins = Math.round(distanceKm * 3.5);
  const totalMins = prepTimeMins + travelMins;

  const now = new Date();
  now.setMinutes(now.getMinutes() + totalMins);
  const arrivalTimeStr = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    minutes: totalMins,
    formatted: `${totalMins} mins`,
    arrivalTimeStr,
  };
}

export interface SwiggyEtaDetails {
  minutes: number;
  minRangeMins: number;
  maxRangeMins: number;
  etaRangeStr: string;
  arrivalTimeStr: string;
  formattedDisplay: string;
  countdownSeconds: number;
}

/**
 * Calculates Swiggy / Zomato style dynamic delivery estimation.
 */
export function calculateSwiggyStyleEta(
  distanceKm: number = 3.5,
  itemCount: number = 2,
  createdAt?: string | Date,
  status?: string,
): SwiggyEtaDetails {
  let prepMins = 10 + Math.min(itemCount * 2, 20);
  let travelMins = Math.max(8, Math.round(distanceKm * 3.5));

  if (status === 'PACKED') {
    prepMins = 3;
  } else if (status === 'PICKED_UP' || status === 'IN_TRANSIT' || status === 'ON_THE_WAY') {
    prepMins = 0;
    travelMins = Math.max(5, Math.round(travelMins * 0.7));
  } else if (status === 'DELIVERED') {
    return {
      minutes: 0,
      minRangeMins: 0,
      maxRangeMins: 0,
      etaRangeStr: 'Delivered',
      arrivalTimeStr: 'Delivered',
      formattedDisplay: 'Delivered',
      countdownSeconds: 0,
    };
  }

  const totalMins = prepMins + travelMins;
  const minRange = Math.max(10, Math.floor(totalMins * 0.85));
  const maxRange = Math.max(minRange + 5, Math.ceil(totalMins * 1.15));

  let remainingMins = totalMins;
  if (createdAt) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const totalSeconds = totalMins * 60;
    const remSec = Math.max(180, totalSeconds - elapsedSeconds);
    remainingMins = Math.ceil(remSec / 60);
  }

  const arrivalDate = new Date(Date.now() + remainingMins * 60 * 1000);
  const arrivalTimeStr = arrivalDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const etaRangeStr = `${minRange}–${maxRange} mins`;

  return {
    minutes: remainingMins,
    minRangeMins: minRange,
    maxRangeMins: maxRange,
    etaRangeStr,
    arrivalTimeStr: `Arriving by ${arrivalTimeStr}`,
    formattedDisplay: `${etaRangeStr} • Arriving by ${arrivalTimeStr}`,
    countdownSeconds: remainingMins * 60,
  };
}

/**
 * Calculates earnings for a delivery order based on distance and order value.
 */
export function calculateOrderEarnings(
  distanceKm: number = 3.5,
  orderTotal: number = 200,
): { baseFee: number; distanceBonus: number; totalEarnings: number } {
  const baseFee = 40;
  const extraKm = Math.max(0, distanceKm - 2);
  const distanceBonus = Math.round(extraKm * 10);
  const totalEarnings = baseFee + distanceBonus;
  return { baseFee, distanceBonus, totalEarnings };
}
