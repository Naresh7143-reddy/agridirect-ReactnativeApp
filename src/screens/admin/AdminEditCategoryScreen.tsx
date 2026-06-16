import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { categoriesApi } from '../../api/categories';
import type { AdminStackParamList } from '../../types/navigation';

type RouteP = RouteProp<AdminStackParamList, 'AdminEditCategory'>;
type NavP   = NativeStackNavigationProp<AdminStackParamList>;

export default function AdminEditCategoryScreen() {
  const route = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const { categoryId } = route.params;

  const [name, setName]        = useState('');
  const [description, setDesc] = useState('');
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await categoriesApi.getById(categoryId);
      setName(res.data.name ?? '');
      setDesc((res.data as any).description ?? '');
    } catch {}
    finally { setLoading(false); }
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Category name is required.'); return; }
    setSaving(true);
    try {
      await categoriesApi.update(categoryId, { name: name.trim(), description: description.trim() || undefined });
      Toast.show({ type:'success', text1:'Category updated!' });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not update category.');
    } finally { setSaving(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Category</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Input label="Category Name *" value={name} onChangeText={setName} placeholder="e.g. Vegetables"/>
          <Input label="Description" value={description} onChangeText={setDesc} placeholder="Optional" multiline numberOfLines={3}/>
        </View>
        <Button onPress={handleSave} loading={saving} style={s.saveBtn}>Save Changes</Button>
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
  card:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm,gap:spacing.sm},
  saveBtn:{marginTop:spacing.md},
});
