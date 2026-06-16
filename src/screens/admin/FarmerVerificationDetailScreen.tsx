import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { adminApi } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import type { PendingFarmer } from '../../types/admin';

type RouteP = RouteProp<AdminStackParamList, 'FarmerVerificationDetail'>;
type NavP   = NativeStackNavigationProp<AdminStackParamList>;

export default function FarmerVerificationDetailScreen() {
  const route = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const { farmerId } = route.params;

  const [farmer, setFarmer]       = useState<PendingFarmer | null>(null);
  const [loading, setLoading]     = useState(true);
  const [rejectReason, setReason] = useState('');
  const [acting, setActing]       = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getPendingFarmers();
      const found = (res.data?.items ?? []).find((f: PendingFarmer) => f.id === farmerId || f.userId === farmerId);
      setFarmer(found ?? null);
    } catch {}
    finally { setLoading(false); }
  }, [farmerId]);

  useEffect(() => { load(); }, [load]);

  const handleVerify = () => {
    Alert.alert('Approve Farmer', `Approve ${farmer?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => {
        setActing(true);
        try {
          await adminApi.verifyFarmer(farmerId);
          Toast.show({ type:'success', text1:'Farmer approved!', text2:'They can now list products.' });
          navigation.goBack();
        } catch { Toast.show({ type:'error', text1:'Failed to approve' }); }
        finally { setActing(false); }
      }},
    ]);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { Alert.alert('Required','Please enter a rejection reason.'); return; }
    Alert.alert('Reject Farmer', `Reject ${farmer?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: async () => {
        setActing(true);
        try {
          await adminApi.rejectFarmer(farmerId, rejectReason.trim());
          Toast.show({ type:'info', text1:'Farmer rejected', text2:'They will be notified.' });
          navigation.goBack();
        } catch { Toast.show({ type:'error', text1:'Failed to reject' }); }
        finally { setActing(false); }
      }},
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>;
  if (!farmer) return <View style={s.center}><Text style={s.err}>Farmer not found or already reviewed</Text></View>;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Farmer Verification</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.avatarCard}>
          <View style={s.avatar}>
            <Icon name="leaf" size={32} color={Colors.white}/>
          </View>
          <Text style={s.name}>{farmer.name}</Text>
          <Text style={s.farmName}>🌾 {farmer.farmName}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Details</Text>
          <Row label="Phone"    value={farmer.phone}/>
          <Row label="Location" value={farmer.location}/>
          <Row label="Submitted" value={new Date(farmer.submittedAt).toLocaleDateString('en-IN')}/>
          {farmer.certifications?.length > 0 && (
            <Row label="Certifications" value={farmer.certifications.join(', ')}/>
          )}
        </View>

        {farmer.documentsUrl && farmer.documentsUrl.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Documents ({farmer.documentsUrl.length})</Text>
            {farmer.documentsUrl.map((url, i) => (
              <Text key={i} style={s.docUrl} numberOfLines={1}>📄 Document {i + 1}</Text>
            ))}
          </View>
        )}

        <View style={s.card}>
          <Text style={s.sectionTitle}>Reject Reason (if rejecting)</Text>
          <TextInput
            style={s.reasonInput}
            value={rejectReason}
            onChangeText={setReason}
            placeholder="Enter reason for rejection..."
            placeholderTextColor={Colors.textHint}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={s.btnRow}>
          <TouchableOpacity style={[s.rejectBtn, acting && s.disabled]} onPress={handleReject} disabled={acting}>
            <Icon name="close-circle" size={18} color={Colors.white}/>
            <Text style={s.btnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.approveBtn, acting && s.disabled]} onPress={handleVerify} disabled={acting}>
            {acting
              ? <ActivityIndicator color={Colors.white} size="small"/>
              : <><Icon name="checkmark-circle" size={18} color={Colors.white}/><Text style={s.btnText}>Approve</Text></>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowVal}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:20},
  err:{color:Colors.textSecondary,textAlign:'center'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.base,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  back:{padding:4},
  headerTitle:{fontSize:17,fontWeight:'700',color:Colors.textPrimary},
  scroll:{padding:spacing.base,gap:spacing.md},
  avatarCard:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.xl,...shadow.sm,alignItems:'center',gap:8},
  avatar:{width:72,height:72,borderRadius:36,backgroundColor:Colors.primary,alignItems:'center',justifyContent:'center'},
  name:{fontSize:18,fontWeight:'700',color:Colors.textPrimary},
  farmName:{fontSize:14,color:Colors.textSecondary},
  card:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm},
  sectionTitle:{fontSize:14,fontWeight:'700',color:Colors.textPrimary,marginBottom:spacing.sm},
  row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderBottomWidth:1,borderBottomColor:Colors.divider},
  rowLabel:{fontSize:13,color:Colors.textSecondary,flex:1},
  rowVal:{fontSize:13,fontWeight:'600',color:Colors.textPrimary,flex:2,textAlign:'right'},
  docUrl:{fontSize:13,color:Colors.primary,paddingVertical:4},
  reasonInput:{borderWidth:1,borderColor:Colors.border,borderRadius:borderRadius.md,padding:spacing.sm,fontSize:13,color:Colors.textPrimary,textAlignVertical:'top',minHeight:80},
  btnRow:{flexDirection:'row',gap:spacing.md,marginBottom:spacing.xl},
  rejectBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:Colors.error,borderRadius:borderRadius.lg,padding:spacing.base},
  approveBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:Colors.success,borderRadius:borderRadius.lg,padding:spacing.base},
  btnText:{color:Colors.white,fontWeight:'700',fontSize:15},
  disabled:{opacity:0.6},
});
