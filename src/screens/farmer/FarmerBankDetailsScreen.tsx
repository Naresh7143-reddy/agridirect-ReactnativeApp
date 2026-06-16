import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { farmerApi } from '../../api/farmer';
import type { BankDetails } from '../../types/farmer';

export default function FarmerBankDetailsScreen() {
  const navigation = useNavigation();

  const [loading, setSaving]      = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [holderName, setHolder]   = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifsc, setIfsc]           = useState('');
  const [bankName, setBankName]   = useState('');
  const [branch, setBranch]       = useState('');
  const [upiId, setUpiId]         = useState('');

  const loadExisting = useCallback(async () => {
    try {
      const res = await farmerApi.getBankDetails();
      const d   = res.data;
      if (d) {
        setHolder(d.accountHolderName ?? '');
        setAccountNo(d.accountNumber ?? '');
        setIfsc(d.ifscCode ?? '');
        setBankName(d.bankName ?? '');
        setBranch(d.branchName ?? '');
        setUpiId(d.upiId ?? '');
      }
    } catch {}
    finally { setFetching(false); }
  }, []);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  const handleSave = async () => {
    if (!holderName.trim() || !accountNo.trim() || !ifsc.trim() || !bankName.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      const data: BankDetails = {
        accountHolderName: holderName.trim(),
        accountNumber: accountNo.trim(),
        ifscCode: ifsc.trim().toUpperCase(),
        bankName: bankName.trim(),
        branchName: branch.trim() || undefined,
        upiId: upiId.trim() || undefined,
      };
      await farmerApi.saveBankDetails(data);
      Toast.show({ type:'success', text1:'Bank details saved!', text2:'Payouts will be sent to this account.' });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save bank details. Please try again.');
    } finally { setSaving(false); }
  };

  if (fetching) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bank Details</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.infoCard}>
          <Icon name="shield-checkmark-outline" size={20} color={Colors.primary}/>
          <Text style={s.infoText}>Your bank details are encrypted and used only for earnings payouts.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Account Details</Text>
          <Input label="Account Holder Name *" value={holderName} onChangeText={setHolder} placeholder="As per bank records"/>
          <Input label="Account Number *" value={accountNo} onChangeText={setAccountNo} placeholder="Enter account number" keyboardType="numeric" secureTextEntry/>
          <Input label="IFSC Code *" value={ifsc} onChangeText={v => setIfsc(v.toUpperCase())} placeholder="e.g. SBIN0001234" autoCapitalize="characters"/>
          <Input label="Bank Name *" value={bankName} onChangeText={setBankName} placeholder="e.g. State Bank of India"/>
          <Input label="Branch Name" value={branch} onChangeText={setBranch} placeholder="Optional"/>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>UPI (Optional)</Text>
          <Input label="UPI ID" value={upiId} onChangeText={setUpiId} placeholder="yourname@upi" keyboardType="email-address" autoCapitalize="none"/>
        </View>

        <Button onPress={handleSave} loading={loading} style={s.saveBtn}>Save Bank Details</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.base,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  back:{padding:4},
  headerTitle:{fontSize:17,fontWeight:'700',color:Colors.textPrimary},
  scroll:{padding:spacing.base,gap:spacing.md},
  infoCard:{flexDirection:'row',alignItems:'flex-start',gap:10,backgroundColor:Colors.successLight,borderRadius:borderRadius.md,padding:spacing.md,borderWidth:1,borderColor:Colors.primary + '44'},
  infoText:{flex:1,fontSize:13,color:Colors.textSecondary,lineHeight:18},
  card:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm,gap:spacing.sm},
  sectionTitle:{fontSize:14,fontWeight:'700',color:Colors.textPrimary,marginBottom:4},
  saveBtn:{marginTop:spacing.md,marginBottom:spacing.xl},
});
