import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import type { AuthScreenProps } from '../../types/navigation';

type Props = AuthScreenProps<'DeliveryRegistration'>;

const DeliveryRegistrationScreen: React.FC<Props> = ({ navigation, route }) => {
  const [name, setName] = React.useState('');
  const [vehicleNumber, setVehicleNumber] = React.useState('');
  const [vehicleType, setVehicleType] = React.useState('BIKE');
  const [loading, setLoading] = React.useState(false);
  const { register, login } = useAuth();

  const handleRegister = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Name required' });
      return;
    }
    if (!vehicleNumber.trim()) {
      Toast.show({ type: 'error', text1: 'Bike / Vehicle Number required' });
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        idToken: route.params.idToken!,
        role: 'DELIVERY' as any,
        vehicleType: vehicleType.trim() || 'BIKE',
        vehicleRegistration: vehicleNumber.trim(),
        vehicleNumber: vehicleNumber.trim(),
      } as any);
      navigation.replace('RegistrationSuccess', { role: 'DELIVERY', name: name.trim() });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      if (/already registered|already exists|conflict/i.test(msg)) {
        try { await login(route.params.idToken!); return; }
        catch (e2: any) {
          Toast.show({ type: 'error', text1: 'Login failed', text2: e2?.message ?? 'Try again' });
        }
      } else {
        Toast.show({ type: 'error', text1: 'Registration failed', text2: msg || 'Please try again' });
      }
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Delivery Agent Setup</Text>
      <Input label="Full Name *" value={name} onChangeText={setName} placeholder="e.g. Ramesh Kumar" required />
      <Input label="Bike / Vehicle Number *" value={vehicleNumber} onChangeText={setVehicleNumber} placeholder="e.g. TS 09 AB 1234" required />
      <Input label="Vehicle Type" value={vehicleType} onChangeText={setVehicleType} placeholder="e.g. BIKE, SCOOTER, AUTO" />
      <Button onPress={handleRegister} loading={loading} fullWidth style={{ marginTop: 16 }}>Register Account</Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 32 },
});

export default DeliveryRegistrationScreen;
