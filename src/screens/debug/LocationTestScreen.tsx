/**
 * Location Test Screen
 * 
 * Use this to quickly test if backend is sending location data
 * Navigate to this screen from anywhere in the app to run diagnostics
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { ordersApi } from '../../api/orders';
import { logLocationDebugInfo } from '../../utils/locationDebug';
import type { Order } from '../../types/order';

export const LocationTestScreen: React.FC = () => {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [order, setOrder] = useState<Order | null>(null);

  const testOrder = async () => {
    if (!orderId.trim()) {
      setResult('❌ Please enter an order ID');
      return;
    }

    setLoading(true);
    setResult('⏳ Fetching order from backend...');

    try {
      const res: any = await ordersApi.getOrderById(orderId.trim());
      const fetched = res?.data ?? res;
      
      setOrder(fetched);
      
      // Run diagnostics
      const debug = logLocationDebugInfo(fetched, orderId);
      
      // Format result
      let resultText = '📊 TEST RESULTS\n\n';
      resultText += `Order: ${fetched.orderNumber || fetched.id}\n`;
      resultText += `Status: ${fetched.status}\n\n`;
      
      resultText += '📍 DELIVERY ADDRESS:\n';
      resultText += `  Type: ${debug.deliveryAddress.type}\n`;
      resultText += `  Has lat? ${debug.deliveryAddress.hasLat ? '✅ YES' : '❌ NO'}\n`;
      resultText += `  Has lng? ${debug.deliveryAddress.hasLng ? '✅ YES' : '❌ NO'}\n`;
      if (debug.deliveryAddress.hasLat && debug.deliveryAddress.hasLng) {
        resultText += `  Coords: ${debug.deliveryAddress.lat}, ${debug.deliveryAddress.lng}\n`;
      }
      
      resultText += '\n🚜 FARMER LOCATION:\n';
      resultText += `  Items: ${debug.farmerLocation.itemsCount}\n`;
      resultText += `  Has coords? ${debug.farmerLocation.firstItemHasCoordinates ? '✅ YES' : '❌ NO'}\n`;
      if (debug.farmerLocation.firstItemHasCoordinates) {
        resultText += `  Coords: ${debug.farmerLocation.farmerLat}, ${debug.farmerLocation.farmerLng}\n`;
      }
      
      resultText += '\n💡 VERDICT:\n';
      resultText += `${debug.recommendation}\n\n`;
      
      if (!debug.hasDeliveryCoordinates || !debug.hasFarmerCoordinates) {
        resultText += '🔧 BACKEND NEEDS TO ADD:\n';
        if (!debug.hasDeliveryCoordinates) {
          resultText += '  • deliveryAddress.lat (number)\n';
          resultText += '  • deliveryAddress.lng (number)\n';
        }
        if (!debug.hasFarmerCoordinates) {
          resultText += '  • items[].farmerLat (number)\n';
          resultText += '  • items[].farmerLng (number)\n';
        }
      }
      
      setResult(resultText);
    } catch (e: any) {
      setResult(`❌ ERROR: ${e?.message || 'Failed to fetch order'}\n\nCheck if:\n• Order ID is correct\n• You are logged in\n• Backend is running`);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const testSampleOrder = () => {
    // Try to get any order from the list
    setResult('⏳ Fetching a sample order...');
    setLoading(true);
    
    ordersApi.getBuyerOrders({ limit: 1 }).then((res: any) => {
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : (data?.items ?? data?.content ?? []);
      
      if (list.length > 0) {
        const sampleOrder = list[0];
        const sampleId = sampleOrder.id || (sampleOrder as any)._id || (sampleOrder as any).orderId;
        setOrderId(sampleId);
        setResult(`✅ Found sample order: ${sampleId}\n\nTap "Test This Order" to check location data.`);
      } else {
        setResult('❌ No orders found. Create an order first.');
      }
    }).catch((e: any) => {
      setResult(`❌ ERROR: ${e?.message || 'Failed to fetch orders'}`);
    }).finally(() => {
      setLoading(false);
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🧪 Location Data Test</Text>
        <Text style={styles.subtitle}>
          Check if backend is sending location coordinates
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Enter Order ID:</Text>
          <TextInput
            style={styles.input}
            value={orderId}
            onChangeText={setOrderId}
            placeholder="e.g., 507f1f77bcf86cd799439011"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={testOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Test This Order</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={testSampleOrder}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Get Sample Order</Text>
            </TouchableOpacity>
          </View>
        </View>

        {result ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : null}

        {order && (
          <View style={styles.rawCard}>
            <Text style={styles.rawTitle}>📄 Raw API Response:</Text>
            <ScrollView 
              horizontal 
              style={styles.rawScroll}
              contentContainerStyle={styles.rawScrollContent}
            >
              <Text style={styles.rawText}>
                {JSON.stringify({
                  deliveryAddress: order.deliveryAddress,
                  items: order.items?.map(item => ({
                    id: (item as any).id,
                    productName: (item as any).productName,
                    farmerName: (item as any).farmerName,
                    farmerLat: (item as any).farmerLat,
                    farmerLng: (item as any).farmerLng,
                  }))
                }, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ How to Use:</Text>
          <Text style={styles.infoText}>
            1. Tap "Get Sample Order" to fetch any order{'\n'}
            2. Or enter an Order ID manually{'\n'}
            3. Tap "Test This Order"{'\n'}
            4. Check the results{'\n\n'}
            
            The test will show if backend is sending:{'\n'}
            • deliveryAddress.lat & lng{'\n'}
            • items[].farmerLat & farmerLng{'\n\n'}
            
            If missing, share results with backend team.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: spacing.base,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: borderRadius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  resultText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  rawCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  rawTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  rawScroll: {
    maxHeight: 200,
  },
  rawScrollContent: {
    paddingRight: spacing.base,
  },
  rawText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.info,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

export default LocationTestScreen;
