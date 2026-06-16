import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';

export default function PaymentMethodsScreen() {
  const navigation = useNavigation();

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <Text style={s.sectionTitle}>UPI</Text>
          <Method icon="phone-portrait-outline" iconBg="#FF6B6B22" iconColor="#FF6B6B" name="Pay via UPI" sub="PhonePe, GPay, Paytm & more"/>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Cards</Text>
          <Method icon="card-outline" iconBg="#2196F322" iconColor="#2196F3" name="Credit / Debit Card" sub="Visa, Mastercard, RuPay"/>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Net Banking</Text>
          <Method icon="business-outline" iconBg={Colors.primary+'22'} iconColor={Colors.primary} name="Net Banking" sub="All major banks supported"/>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Cash on Delivery</Text>
          <Method icon="cash-outline" iconBg={Colors.success+'22'} iconColor={Colors.success} name="Cash on Delivery" sub="Pay when your order arrives"/>
        </View>

        <View style={s.infoCard}>
          <Icon name="shield-checkmark-outline" size={18} color={Colors.primary}/>
          <Text style={s.infoText}>All payments secured with 256-bit SSL encryption via Razorpay.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Method({ icon, iconBg, iconColor, name, sub }: { icon: string; iconBg: string; iconColor: string; name: string; sub: string }) {
  return (
    <View style={s.methodRow}>
      <View style={[s.methodIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={22} color={iconColor}/>
      </View>
      <View style={s.methodInfo}>
        <Text style={s.methodName}>{name}</Text>
        <Text style={s.methodSub}>{sub}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={Colors.textHint}/>
    </View>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, backgroundColor:Colors.background },
  header:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:spacing.base, backgroundColor:Colors.surface, borderBottomWidth:1, borderBottomColor:Colors.border },
  back:{ padding:4 },
  headerTitle:{ fontSize:17, fontWeight:'700', color:Colors.textPrimary },
  scroll:{ padding:spacing.base, gap:spacing.md },
  card:{ backgroundColor:Colors.surface, borderRadius:borderRadius.lg, padding:spacing.base, ...shadow.sm },
  sectionTitle:{ fontSize:12, fontWeight:'700', color:Colors.textSecondary, marginBottom:spacing.sm, textTransform:'uppercase', letterSpacing:0.5 },
  methodRow:{ flexDirection:'row', alignItems:'center', gap:spacing.md },
  methodIcon:{ width:44, height:44, borderRadius:borderRadius.md, alignItems:'center', justifyContent:'center' },
  methodInfo:{ flex:1 },
  methodName:{ fontSize:14, fontWeight:'600', color:Colors.textPrimary },
  methodSub:{ fontSize:12, color:Colors.textSecondary, marginTop:2 },
  infoCard:{ flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:Colors.successLight, borderRadius:borderRadius.md, padding:spacing.md, borderWidth:1, borderColor:Colors.primary+'33' },
  infoText:{ flex:1, fontSize:12, color:Colors.textSecondary, lineHeight:18 },
});
