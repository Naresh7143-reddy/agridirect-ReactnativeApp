import { useState, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';

// Type stubs for older versions of the geolocation package
type GeoPosition = { coords: { latitude: number; longitude: number; accuracy: number; altitude?: number | null; altitudeAccuracy?: number | null; heading?: number | null; speed?: number | null }; timestamp: number };
type GeoError = { code: number; message: string; PERMISSION_DENIED: number; POSITION_UNAVAILABLE: number; TIMEOUT: number };
import { Platform, PermissionsAndroid } from 'react-native';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;
}

const initialState: LocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  isLoading: false,
  error: null,
  hasPermission: null,
};

export const getAccurateOrNetworkPosition = (
  options?: { timeoutHigh?: number; timeoutLow?: number },
): Promise<GeoPosition> => {
  const timeoutHigh = options?.timeoutHigh ?? 6000;
  const timeoutLow = options?.timeoutLow ?? 15000;

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos: GeoPosition) => resolve(pos),
      (_err: GeoError) => {
        // Fallback to low accuracy (network/wifi) if high accuracy (GPS) times out or fails
        Geolocation.getCurrentPosition(
          (pos2: GeoPosition) => resolve(pos2),
          (err2: GeoError) => reject(err2),
          { enableHighAccuracy: false, timeout: timeoutLow, maximumAge: 60000 },
        );
      },
      { enableHighAccuracy: true, timeout: timeoutHigh, maximumAge: 10000 },
    );
  });
};

export const useLocation = () => {
  const [state, setState] = useState<LocationState>(initialState);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        Geolocation.requestAuthorization();
        // iOS permission is handled via Info.plist; assume granted after request
        resolve(true);
      });
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'AgriDirect Location Access',
          message: 'AgriDirect needs your location to show nearby farmers and estimate delivery time.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const hasPermission = await requestPermission();
    setState((prev) => ({ ...prev, hasPermission }));

    if (!hasPermission) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Location permission denied',
      }));
      return null;
    }

    try {
      const position = await getAccurateOrNetworkPosition();
      setState((prev) => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        isLoading: false,
        error: null,
      }));
      return position;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Could not fetch location',
      }));
      return null;
    }
  }, [requestPermission]);

  const watchLocation = useCallback(
    (onUpdate: (position: GeoPosition) => void) => {
      const watchId = Geolocation.watchPosition(
        onUpdate,
        (error: GeoError) => setState((prev) => ({ ...prev, error: error.message })),
        { enableHighAccuracy: true, distanceFilter: 10 },
      );
      return () => Geolocation.clearWatch(watchId);
    },
    [],
  );

  return { ...state, getCurrentLocation, watchLocation, requestPermission };
};
