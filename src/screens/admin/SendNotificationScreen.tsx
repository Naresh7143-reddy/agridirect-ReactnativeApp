import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { adminApi } from '../../api/admin';
import { UserRole } from '../../types/auth';

const ROLE_OPTIONS: { label: string; value: UserRole | 'ALL' }[] = [
  { label: 'All Users', value: 'ALL' },
  { label: 'Buyers',    value: UserRole.BUYER },
  { label: 'Farmers',   value: UserRole.FARMER },
  { label: 'Delivery',  value: UserRole.DELIVERY },
];

export default function SendNotificationScreen() {
  const navigation = useNavigation();
  const [title, setTitle]         = useState('');
  const [body, setBody]           = useState('');
  const [selected, setSelected]   = useState<'ALL' | UserRole>('ALL');
  const [sending, setSending]     = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Required', 'Please enter both title and message.');
      return;
    }
    Alert.alert('Send Notification', `Send to: ${selected === 'ALL' ? 'All Users' : selected}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        setSending(true);
        try {
          const payload = selected === 'ALL'
            ? { title: title.trim(), body: body.trim() }
            : { title: title.trim(), body: body.trim(), roles: [selected as UserRole] };
          const res = await adminApi.sendNotification(payload);
          Toast.show({ type:'success', text1:`Sent to ${res.data?.sent ?? 0} users` });
          navigation.goBack();
        } catch {
          Alert.alert('Error', 'Failed to send notification.');
        } finally { setSending(false); }
      }},
    ]);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Send Notification</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.sectionTitle}>Target Audience</Text>
          <View style={s.roleRow}>
            {ROLE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.roleBtn, selected === opt.value && s.roleBtnActive]}
                onPress={() => setSelected(opt.value)}
              >
                <Text style={[s.roleBtnText, selected === opt.value && s.roleBtnTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Message</Text>
          <Input label="Title *" value={title} onChangeText={setTitle} placeholder="e.g. New offers available!"/>
          <Input label="Message *" value={body} onChangeText={setBody} placeholder="Enter notification message..." multiline numberOfLines={4}/>
        </View>

        <View style={s.previewCard}>
          <View style={s.previewHeader}>
            <Icon name="notifications" size={16} color={Colors.primary}/>
            <Text style={s.previewLabel}>AgriDirect</Text>
          </View>
          <Text style={s.previewTitle}>{title || 'Notification title'}</Text>
          <Text style={s.previewBody}>{body || 'Notification message...'}</Text>
        </View>

        <Button onPress={handleSend} loading={sending} style={s.sendBtn}>{`Send to ${selected === 'ALL' ? 'All Users' : selected}`}</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.background},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.base,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  back:{padding:4},
  headerTitle:{fontSize:17,fontWeight:'700',color:Colors.textPrimary},
  scroll:{padding:spacing.base,gap:spacing.md},
  card:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm,gap:spacing.sm},
  sectionTitle:{fontSize:14,fontWeight:'700',color:Colors.textPrimary,marginBottom:4},
  roleRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  roleBtn:{borderWidth:1,borderColor:Colors.border,borderRadius:borderRadius.full,paddingHorizontal:14,paddingVertical:8},
  roleBtnActive:{backgroundColor:Colors.primary,borderColor:Colors.primary},
  roleBtnText:{fontSize:13,color:Colors.textSecondary,fontWeight:'500'},
  roleBtnTextActive:{color:Colors.white,fontWeight:'700'},
  previewCard:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm,borderLeftWidth:4,borderLeftColor:Colors.primary},
  previewHeader:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6},
  previewLabel:{fontSize:12,color:Colors.primary,fontWeight:'700'},
  previewTitle:{fontSize:14,fontWeight:'700',color:Colors.textPrimary},
  previewBody:{fontSize:13,color:Colors.textSecondary,marginTop:4},
  sendBtn:{marginTop:4,marginBottom:spacing.xl},
});
