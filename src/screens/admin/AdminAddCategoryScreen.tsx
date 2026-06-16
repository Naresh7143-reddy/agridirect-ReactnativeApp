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
import { categoriesApi } from '../../api/categories';

export default function AdminAddCategoryScreen() {
  const navigation = useNavigation();
  const [name, setName]           = useState('');
  const [description, setDesc]    = useState('');
  const [saving, setSaving]       = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Category name is required.'); return; }
    setSaving(true);
    try {
      await categoriesApi.create({ name: name.trim(), description: description.trim() || undefined });
      Toast.show({ type:'success', text1:'Category created!', text2:name });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not create category. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add Category</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Input label="Category Name *" value={name} onChangeText={setName} placeholder="e.g. Vegetables"/>
          <Input label="Description" value={description} onChangeText={setDesc} placeholder="Optional description" multiline numberOfLines={3}/>
        </View>
        <Button onPress={handleSave} loading={saving} style={s.saveBtn}>Create Category</Button>
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
  saveBtn:{marginTop:spacing.md},
});
