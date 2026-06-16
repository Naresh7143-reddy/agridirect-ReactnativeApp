import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import type { AuthScreenProps } from '../../types/navigation';

type Props = AuthScreenProps<'BuyerRegistration'>;

const BuyerRegistrationScreen: React.FC<Props> = ({ navigation, route }) => {
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { register, login } = useAuth();

  const handleRegister = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Name required', text2: 'Please enter your name' });
      return;
    }
    setLoading(true);
    try {
      await register({ name: name.trim(), idToken: route.params.idToken!, role: 'BUYER' as any });
      navigation.replace('RegistrationSuccess', { role: 'BUYER', name: name.trim() });
    } catch (e: any) {
      // Recovery path: if backend says user already exists, just log them in
      // instead of looping back to the splash screen.
      const msg = e?.response?.data?.message || e?.message || '';
      if (/already registered|already exists|conflict/i.test(msg)) {
        try {
          await login(route.params.idToken!);
          // AppNavigator will route to the role navigator automatically
          return;
        } catch (e2: any) {
          Toast.show({ type: 'error', text1: 'Login failed', text2: e2?.message ?? 'Try again' });
        }
      } else {
        Toast.show({ type: 'error', text1: 'Registration failed', text2: msg || 'Please try again' });
      }
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Input label="Your Name" value={name} onChangeText={setName} required />
      <Button onPress={handleRegister} loading={loading} fullWidth>Get Started</Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 32 },
});

export default BuyerRegistrationScreen;
