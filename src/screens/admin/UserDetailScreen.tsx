import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { adminApi } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import type { User } from '../../types/auth';

type RouteP = RouteProp<AdminStackParamList, 'UserDetail'>;
type NavP   = NativeStackNavigationProp<AdminStackParamList>;

export default function UserDetailScreen() {
  const route = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const { userId } = route.params;

  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(false);

  const load = useCallback(async () => {
    try { const res = await adminApi.getUserById(userId); setUser(res.data); }
    catch { Alert.alert('Error','Could not load user'); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleBlock = () => {
    if (!user) return;
    const isBlocked = (user as any).isBlocked;
    Alert.alert(isBlocked ? 'Unblock User' : 'Block User',
      `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: isBlocked ? 'default' : 'destructive', onPress: async () => {
          setActing(true);
          try {
            if (isBlocked) await adminApi.unblockUser(userId);
            else await adminApi.blockUser(userId);
            Toast.show({ type:'success', text1:`User ${isBlocked ? 'unblocked' : 'blocked'}` });
            load();
          } catch { Toast.show({ type:'error', text1:'Action failed' }); }
          finally { setActing(false); }
        }},
      ]
    );
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>;
  if (!user)   return <View style={s.center}><Text>User not found</Text></View>;

  const isBlocked = (user as any).isBlocked;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>User Detail</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.avatarCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user.name?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
          </View>
          <Text style={s.userName}>{user.name}</Text>
          <View style={[s.roleBadge,{backgroundColor: Colors.primary+'22'}]}>
            <Text style={[s.roleText,{color:Colors.primary}]}>{(user as any).role ?? 'USER'}</Text>
          </View>
          {isBlocked && (
            <View style={[s.roleBadge,{backgroundColor:Colors.errorLight}]}>
              <Text style={[s.roleText,{color:Colors.error}]}>BLOCKED</Text>
            </View>
          )}
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>Account Info</Text>
          <Row label="Phone" value={(user as any).phone ?? '-'}/>
          <Row label="Email" value={(user as any).email ?? '-'}/>
          <Row label="Role"  value={(user as any).role ?? '-'}/>
          <Row label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '-'}/>
        </View>

        <TouchableOpacity
          style={[s.actionBtn, isBlocked ? s.unblockBtn : s.blockBtn, acting && s.disabledBtn]}
          onPress={handleBlock}
          disabled={acting}
        >
          {acting
            ? <ActivityIndicator color={Colors.white} size="small"/>
            : <Text style={s.actionText}>{isBlocked ? 'Unblock User' : 'Block User'}</Text>
          }
        </TouchableOpacity>
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
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.base,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  back:{padding:4},
  headerTitle:{fontSize:17,fontWeight:'700',color:Colors.textPrimary},
  scroll:{padding:spacing.base,gap:spacing.md},
  avatarCard:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.xl,...shadow.sm,alignItems:'center',gap:8},
  avatar:{width:72,height:72,borderRadius:36,backgroundColor:Colors.primary,alignItems:'center',justifyContent:'center'},
  avatarText:{fontSize:30,fontWeight:'800',color:Colors.white},
  userName:{fontSize:18,fontWeight:'700',color:Colors.textPrimary},
  roleBadge:{borderRadius:borderRadius.full,paddingHorizontal:12,paddingVertical:4},
  roleText:{fontSize:12,fontWeight:'700'},
  card:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm},
  sectionTitle:{fontSize:14,fontWeight:'700',color:Colors.textPrimary,marginBottom:spacing.sm},
  row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderBottomWidth:1,borderBottomColor:Colors.divider},
  rowLabel:{fontSize:13,color:Colors.textSecondary},
  rowVal:{fontSize:13,fontWeight:'600',color:Colors.textPrimary},
  actionBtn:{borderRadius:borderRadius.lg,padding:spacing.base,alignItems:'center',marginBottom:spacing.xl},
  blockBtn:{backgroundColor:Colors.error},
  unblockBtn:{backgroundColor:Colors.success},
  disabledBtn:{opacity:0.6},
  actionText:{color:Colors.white,fontWeight:'700',fontSize:15},
});
