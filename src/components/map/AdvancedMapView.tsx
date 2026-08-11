// FILE: src/components/map/AdvancedMapView.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Polyline, Circle, Line } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface MapLocation {
  latitude: number;
  longitude: number;
  label?: string;
  title?: string;
  subtitle?: string;
  type?: 'pickup' | 'dropoff' | 'driver' | 'pin';
}

export interface TurnInstruction {
  arrow: string;
  instruction: string;
  subText?: string;
}

export type MapTheme = 'swiggy' | 'zomato' | 'green' | 'dark' | 'satellite' | 'light';

export interface AdvancedMapViewProps {
  mode?: 'tracking' | 'navigation' | 'picker' | 'preview';
  initialRegion?: {
    latitude: number;
    longitude: number;
    zoom?: number;
  };
  pickupLocation?: MapLocation;
  dropoffLocation?: MapLocation;
  driverLocation?: MapLocation;
  vehicleType?: 'BIKE' | 'VAN' | 'TRUCK' | 'AUTO' | 'SCOOTER' | string;
  driverName?: string;
  etaMinutes?: number;
  distanceKm?: number;
  speedKmH?: number;
  turnInstruction?: TurnInstruction;
  onLocationSelect?: (location: { latitude: number; longitude: number }) => void;
  style?: any;
  showControls?: boolean;
  showLayerSwitcher?: boolean;
  showHud?: boolean;
  theme?: MapTheme;
  interactive?: boolean;
}

const TILE_SIZE = 256;

// Convert Lat/Lng to Mercator Tile coordinates
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return { x, y };
}

// Convert Lat/Lng to relative pixel coordinates within map canvas
function latLngToPixel(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  canvasW: number,
  canvasH: number,
) {
  const scale = Math.pow(2, zoom) * TILE_SIZE;
  const centerWorldX = ((centerLng + 180) / 360) * scale;
  const centerLatRad = (centerLat * Math.PI) / 180;
  const centerWorldY =
    ((1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) /
      2) *
    scale;

  const targetWorldX = ((lng + 180) / 360) * scale;
  const targetLatRad = (lat * Math.PI) / 180;
  const targetWorldY =
    ((1 - Math.log(Math.tan(targetLatRad) + 1 / Math.cos(targetLatRad)) / Math.PI) /
      2) *
    scale;

  const pixelX = canvasW / 2 + (targetWorldX - centerWorldX);
  const pixelY = canvasH / 2 + (targetWorldY - centerWorldY);

  return { x: pixelX, y: pixelY };
}

const VEHICLE_ICONS: Record<string, string> = {
  BIKE: '🏍️',
  SCOOTER: '🛵',
  BICYCLE: '🚲',
  AUTO: '🛺',
  VAN: '🚐',
  TRUCK: '🚚',
};

const THEME_TILES: Record<MapTheme, (x: number, y: number, z: number) => string> = {
  swiggy: (x, y, z) => `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`,
  zomato: (x, y, z) => `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`,
  green: (x, y, z) => `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`,
  light: (x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  dark: (x, y, z) => `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`,
  satellite: (x, y, z) => `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`,
};

const THEME_BG: Record<MapTheme, string> = {
  swiggy: '#0D171E',
  zomato: '#F9FBF9',
  green: '#E8F5E9',
  light: '#F5F5F5',
  dark: '#121B22',
  satellite: '#1B2A1C',
};

export const AdvancedMapView: React.FC<AdvancedMapViewProps> = ({
  mode = 'tracking',
  initialRegion = { latitude: 13.0827, longitude: 80.2707, zoom: 14 },
  pickupLocation = { latitude: 13.085, longitude: 80.265, title: 'Farmer Pickup' },
  dropoffLocation = { latitude: 13.078, longitude: 80.28, title: 'Buyer Dropoff' },
  driverLocation = { latitude: 13.082, longitude: 80.272 },
  vehicleType = 'BIKE',
  driverName = 'Delivery Executive',
  etaMinutes = 12,
  distanceKm = 2.4,
  speedKmH = 32,
  turnInstruction = {
    arrow: '↱',
    instruction: 'Turn right onto Grand Trunk Road',
    subText: 'In 250 meters',
  },
  onLocationSelect,
  style,
  showControls = true,
  showLayerSwitcher = true,
  showHud = true,
  theme: initialTheme = 'swiggy',
  interactive = true,
}) => {
  const [mapTheme, setMapTheme] = useState<MapTheme>(initialTheme);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [zoom, setZoom] = useState(initialRegion.zoom || 15);
  const [is3DTilt, setIs3DTilt] = useState(false);

  const [center, setCenter] = useState({
    latitude: driverLocation?.latitude || initialRegion.latitude,
    longitude: driverLocation?.longitude || initialRegion.longitude,
  });

  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const currentPanOffset = useRef({ x: 0, y: 0 });

  // Pulsing animations for Swiggy/Zomato live radar & moving marker
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const outerPulseAnim = useRef(new Animated.Value(1)).current;
  const dashOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    );
    const outerPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(outerPulseAnim, { toValue: 2.2, duration: 1600, useNativeDriver: true }),
        Animated.timing(outerPulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ]),
    );
    const dashLoop = Animated.loop(
      Animated.timing(dashOffset, { toValue: -60, duration: 1800, useNativeDriver: false }),
    );

    pulseLoop.start();
    outerPulseLoop.start();
    dashLoop.start();

    return () => {
      pulseLoop.stop();
      outerPulseLoop.stop();
      dashLoop.stop();
    };
  }, [pulseAnim, outerPulseAnim, dashOffset]);

  // Recenter map center when driver location updates in tracking mode
  useEffect(() => {
    if (mode === 'tracking' && driverLocation) {
      setCenter({ latitude: driverLocation.latitude, longitude: driverLocation.longitude });
    }
  }, [driverLocation, mode]);

  // Handle Pan gestures for interactive map dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: (_, g) => interactive && (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3),
      onPanResponderGrant: () => {
        panX.setOffset(currentPanOffset.current.x);
        panY.setOffset(currentPanOffset.current.y);
        panX.setValue(0);
        panY.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dx: panX, dy: panY }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        currentPanOffset.current.x += g.dx;
        currentPanOffset.current.y += g.dy;
        panX.flattenOffset();
        panY.flattenOffset();

        if (mode === 'picker' && onLocationSelect) {
          onLocationSelect({
            latitude: center.latitude - g.dy * 0.00008,
            longitude: center.longitude - g.dx * 0.00008,
          });
        }
      },
    }),
  ).current;

  const resetRecenter = () => {
    Animated.spring(panX, { toValue: 0, useNativeDriver: false }).start();
    Animated.spring(panY, { toValue: 0, useNativeDriver: false }).start();
    currentPanOffset.current = { x: 0, y: 0 };
    setCenter({
      latitude: driverLocation?.latitude || pickupLocation?.latitude || initialRegion.latitude,
      longitude: driverLocation?.longitude || pickupLocation?.longitude || initialRegion.longitude,
    });
  };

  const containerWidth = style?.width || SCREEN_WIDTH;
  const containerHeight = style?.height || 360;

  // Calculate pixel positions for markers & polylines
  const pPickup = latLngToPixel(
    pickupLocation.latitude,
    pickupLocation.longitude,
    center.latitude,
    center.longitude,
    zoom,
    containerWidth,
    containerHeight,
  );

  const pDropoff = latLngToPixel(
    dropoffLocation.latitude,
    dropoffLocation.longitude,
    center.latitude,
    center.longitude,
    zoom,
    containerWidth,
    containerHeight,
  );

  const pDriver = latLngToPixel(
    driverLocation.latitude,
    driverLocation.longitude,
    center.latitude,
    center.longitude,
    zoom,
    containerWidth,
    containerHeight,
  );

  // Generate Map Tile URLs for background grid
  const tiles = useMemo(() => {
    const centerTile = latLngToTile(center.latitude, center.longitude, zoom);
    const tileList = [];
    const radius = 2; // Render 5x5 tile matrix for smooth panning

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const tx = centerTile.x + dx;
        const ty = centerTile.y + dy;
        tileList.push({
          key: `${zoom}-${tx}-${ty}`,
          url: THEME_TILES[mapTheme](tx, ty, zoom),
          left: containerWidth / 2 + dx * TILE_SIZE - TILE_SIZE / 2,
          top: containerHeight / 2 + dy * TILE_SIZE - TILE_SIZE / 2,
        });
      }
    }
    return tileList;
  }, [center, zoom, mapTheme, containerWidth, containerHeight]);

  // Swiggy/Zomato realistic curved waypoints along road curves
  const waypoints = useMemo(() => {
    const points = [pPickup];
    const dx = pDropoff.x - pPickup.x;
    const dy = pDropoff.y - pPickup.y;

    // Realistic road curve waypoints
    points.push({ x: pPickup.x + dx * 0.3 + 30, y: pPickup.y + dy * 0.15 - 20 });
    if (mode === 'tracking' || mode === 'navigation') {
      points.push(pDriver);
    }
    points.push({ x: pPickup.x + dx * 0.65 - 20, y: pPickup.y + dy * 0.7 + 25 });
    points.push(pDropoff);

    return points;
  }, [pPickup, pDropoff, pDriver, mode]);

  const svgPolylinePoints = waypoints.map((p) => `${p.x},${p.y}`).join(' ');

  const primaryRouteColor = mapTheme === 'swiggy' ? '#00E676' : mapTheme === 'zomato' ? '#E53935' : Colors.primary;
  const accentRouteColor = mapTheme === 'swiggy' ? '#00B0FF' : mapTheme === 'zomato' ? '#FF9800' : Colors.secondary;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: THEME_BG[mapTheme] },
        style,
      ]}
      {...panResponder.panHandlers}
    >
      {/* Map Tile Canvas Layer with optional 3D Tilt perspective */}
      <Animated.View
        style={[
          styles.tileCanvas,
          {
            transform: [
              { translateX: panX },
              { translateY: panY },
              { rotateX: is3DTilt ? '28deg' : '0deg' },
              { scale: is3DTilt ? 1.08 : 1.0 },
            ],
          },
        ]}
      >
        {tiles.map((t) => (
          <Image
            key={t.key}
            source={{ uri: t.url }}
            style={[
              styles.tileImage,
              {
                left: t.left,
                top: t.top,
                width: TILE_SIZE,
                height: TILE_SIZE,
                opacity: mapTheme === 'swiggy' || mapTheme === 'dark' ? 0.88 : 0.96,
              },
            ]}
            resizeMode="cover"
          />
        ))}

        {/* Swiggy/Zomato SVG Glowing Route Polyline Layer */}
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="swiggyRouteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={primaryRouteColor} stopOpacity="1" />
              <Stop offset="60%" stopColor={accentRouteColor} stopOpacity="1" />
              <Stop offset="100%" stopColor="#7C4DFF" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={primaryRouteColor} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={accentRouteColor} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>

          {/* Polyline Glow Aura */}
          <Polyline
            points={svgPolylinePoints}
            fill="none"
            stroke="url(#glowGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Polyline Outer Drop Shadow */}
          <Polyline
            points={svgPolylinePoints}
            fill="none"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Polyline Main Swiggy Neon Stroke */}
          <Polyline
            points={svgPolylinePoints}
            fill="none"
            stroke="url(#swiggyRouteGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Animated Flowing Dash Dots */}
          <Polyline
            points={svgPolylinePoints}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeDasharray="10 14"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        </Svg>

        {/* Farmer Pickup Marker Badge */}
        <View style={[styles.markerWrap, { left: pPickup.x - 22, top: pPickup.y - 44 }]}>
          <View style={[styles.swiggyCallout, { borderColor: Colors.primary }]}>
            <Text style={styles.calloutTag}>FARM PICKUP</Text>
            <Text style={styles.calloutTitle}>{pickupLocation.title || 'Farmer Ramesh'}</Text>
          </View>
          <View style={[styles.pinCircle, { backgroundColor: Colors.primary }]}>
            <Text style={styles.pinIcon}>🌾</Text>
          </View>
          <View style={[styles.pinStem, { backgroundColor: Colors.primary }]} />
        </View>

        {/* Buyer Dropoff Marker Badge */}
        <View style={[styles.markerWrap, { left: pDropoff.x - 22, top: pDropoff.y - 44 }]}>
          <View style={[styles.swiggyCallout, { borderColor: '#E53935' }]}>
            <Text style={[styles.calloutTag, { color: '#E53935' }]}>CUSTOMER DROP</Text>
            <Text style={styles.calloutTitle}>{dropoffLocation.title || 'Buyer Location'}</Text>
          </View>
          <View style={[styles.pinCircle, { backgroundColor: '#E53935' }]}>
            <Text style={styles.pinIcon}>🏠</Text>
          </View>
          <View style={[styles.pinStem, { backgroundColor: '#E53935' }]} />
        </View>

        {/* Animated Live Swiggy/Zomato Delivery Executive Vehicle Marker */}
        {mode !== 'picker' && (
          <View style={[styles.markerWrap, { left: pDriver.x - 26, top: pDriver.y - 26 }]}>
            {/* Outer Satellite Radar Pulse Ring */}
            <Animated.View
              style={[
                styles.radarPulseOuter,
                {
                  transform: [{ scale: outerPulseAnim }],
                  borderColor: primaryRouteColor,
                },
              ]}
            />
            {/* Inner Live Radar Pulse Ring */}
            <Animated.View
              style={[
                styles.radarPulse,
                {
                  transform: [{ scale: pulseAnim }],
                  borderColor: primaryRouteColor,
                },
              ]}
            />

            {/* Vehicle Card Bubble */}
            <View style={styles.driverCalloutBubble}>
              <Text style={styles.driverCalloutText}>{driverName.split(' ')[0]} • {speedKmH} km/h</Text>
            </View>

            {/* Delivery Partner 3D Badge */}
            <View style={[styles.driverBadge, { backgroundColor: primaryRouteColor }]}>
              <Text style={styles.driverIcon}>
                {VEHICLE_ICONS[vehicleType] || '🏍️'}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Location Picker Target Crosshair */}
      {mode === 'picker' && (
        <View pointerEvents="none" style={styles.pickerContainer}>
          <Animated.View style={[styles.pickerRipple, { transform: [{ scale: pulseAnim }], backgroundColor: primaryRouteColor + '30' }]} />
          <View style={styles.pickerCrosshairPin}>
            <Icon name="location" size={42} color={primaryRouteColor} />
          </View>
        </View>
      )}

      {/* Swiggy/Zomato Top Turn-by-Turn Navigation HUD Card */}
      {showHud && mode === 'navigation' && (
        <View style={styles.hudCard}>
          <View style={[styles.hudArrowBox, { backgroundColor: primaryRouteColor }]}>
            <Text style={styles.hudArrow}>{turnInstruction.arrow}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hudInstruction}>{turnInstruction.instruction}</Text>
            <Text style={styles.hudSub}>{turnInstruction.subText || 'In 180 meters'}</Text>
          </View>
          <View style={styles.speedBadge}>
            <Text style={styles.speedValue}>{speedKmH}</Text>
            <Text style={styles.speedUnit}>KM/H</Text>
          </View>
        </View>
      )}

      {/* Swiggy/Zomato Floating Live Tracking Chip */}
      {showHud && mode === 'tracking' && (
        <View style={styles.etaChip}>
          <View style={styles.livePulseDot} />
          <Text style={styles.etaChipText}>⚡ LIVE TRACKING • ETA {etaMinutes} MINS ({distanceKm} km)</Text>
        </View>
      )}

      {/* Swiggy/Zomato Style Floating Controls */}
      {showControls && (
        <View style={styles.controlsWrap}>
          {/* Zoom In */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setZoom((z) => Math.min(z + 1, 18))}
            activeOpacity={0.8}
          >
            <Text style={styles.controlText}>+</Text>
          </TouchableOpacity>

          {/* Zoom Out */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setZoom((z) => Math.max(z - 1, 11))}
            activeOpacity={0.8}
          >
            <Text style={styles.controlText}>−</Text>
          </TouchableOpacity>

          {/* Recenter */}
          <TouchableOpacity style={styles.controlBtn} onPress={resetRecenter} activeOpacity={0.8}>
            <Icon name="locate" size={18} color={primaryRouteColor} />
          </TouchableOpacity>

          {/* 3D Tilt Compass Toggle */}
          <TouchableOpacity
            style={[styles.controlBtn, is3DTilt && { backgroundColor: primaryRouteColor }]}
            onPress={() => setIs3DTilt(!is3DTilt)}
            activeOpacity={0.8}
          >
            <Icon name="compass-outline" size={18} color={is3DTilt ? Colors.white : primaryRouteColor} />
          </TouchableOpacity>

          {/* Layer Switcher */}
          {showLayerSwitcher && (
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => setShowThemeModal(!showThemeModal)}
              activeOpacity={0.8}
            >
              <Icon name="layers" size={18} color={primaryRouteColor} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Map Style Switcher Modal */}
      {showThemeModal && (
        <View style={styles.themeModal}>
          <Text style={styles.themeTitle}>Select Map Style</Text>
          {(
            [
              { id: 'swiggy', label: '🛵 Swiggy Dark' },
              { id: 'zomato', label: '🍕 Zomato Light' },
              { id: 'green', label: '🌿 Agri Green' },
              { id: 'dark', label: '🌙 Night Dark' },
              { id: 'satellite', label: '🛰️ Satellite 3D' },
              { id: 'light', label: '☀️ Standard' },
            ] as { id: MapTheme; label: string }[]
          ).map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.themeOption,
                mapTheme === t.id && styles.themeOptionSelected,
              ]}
              onPress={() => {
                setMapTheme(t.id);
                setShowThemeModal(false);
              }}
            >
              <Text
                style={[
                  styles.themeLabel,
                  mapTheme === t.id && styles.themeLabelSelected,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default AdvancedMapView;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  tileCanvas: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  tileImage: {
    position: 'absolute',
  },
  markerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swiggyCallout: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    marginBottom: 5,
    borderLeftWidth: 3,
    ...shadow.md,
  },
  calloutTag: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  calloutTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...shadow.lg,
  },
  pinIcon: {
    fontSize: 16,
  },
  pinStem: {
    width: 3,
    height: 8,
    borderRadius: 1.5,
  },
  radarPulseOuter: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
  },
  radarPulse: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 230, 118, 0.18)',
  },
  driverCalloutBubble: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
    ...shadow.sm,
  },
  driverCalloutText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
  },
  driverBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.white,
    ...shadow.xl,
  },
  driverIcon: {
    fontSize: 19,
  },
  pickerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRipple: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  pickerCrosshairPin: {
    marginBottom: 20,
    ...shadow.md,
  },
  hudCard: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.xl,
  },
  hudArrowBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudArrow: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: '800',
  },
  hudInstruction: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hudSub: {
    fontSize: 12,
    color: Colors.textHint,
    marginTop: 2,
  },
  speedBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  speedValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  speedUnit: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  etaChip: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    ...shadow.xl,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  etaChipText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  controlsWrap: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    gap: 8,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  controlText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  themeModal: {
    position: 'absolute',
    right: 56,
    bottom: 16,
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    padding: 10,
    width: 160,
    ...shadow.xl,
  },
  themeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textHint,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  themeOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
  },
  themeOptionSelected: {
    backgroundColor: Colors.successLight,
  },
  themeLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  themeLabelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
