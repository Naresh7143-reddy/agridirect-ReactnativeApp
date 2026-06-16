import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { categoriesApi } from '../../api/categories';
import type { Category } from '../../types/category';
import type { AdminStackParamList } from '../../types/navigation';

type NavP = NativeStackNavigationProp<AdminStackParamList>;

export default function AdminCategoriesScreen() {
  const navigation = useNavigation<NavP>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefresh]    = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefresh(true); else setLoading(true);
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data ?? []);
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = (cat: Category) => {
    Alert.alert(
      cat.isActive ? 'Deactivate Category' : 'Activate Category',
      `Are you sure you want to ${cat.isActive ? 'deactivate' : 'activate'} "${cat.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: async () => {
          try {
            await categoriesApi.toggle(cat.id);
            Toast.show({ type:'success', text1:`Category ${cat.isActive ? 'deactivated' : 'activated'}` });
            load();
          } catch { Toast.show({ type:'error', text1:'Failed to update category' }); }
        }},
      ]
    );
  };

  const handleDelete = (cat: Category) => {
    Alert.alert('Delete Category', `Delete "${cat.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await categoriesApi.delete(cat.id);
          Toast.show({ type:'success', text1:'Category deleted' });
          load();
        } catch { Toast.show({ type:'error', text1:'Cannot delete — has active products' }); }
      }},
    ]);
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Categories</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AdminAddCategory')}>
          <Icon name="add" size={20} color={Colors.white}/>
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>
      ) : (
        <FlashList
          data={categories}
          keyExtractor={c => c.id}
          estimatedItemSize={72}
          renderItem={({ item }) => (
            <View style={[s.card, !item.isActive && s.cardInactive]}>
              <View style={s.cardLeft}>
                {item.imageUrl
                  ? <FastImage source={{uri: item.imageUrl}} style={s.catImg} resizeMode={FastImage.resizeMode.cover}/>
                  : <View style={[s.catImg, s.catImgPlaceholder]}><Icon name="layers" size={20} color={Colors.primary}/></View>
                }
                <View>
                  <Text style={[s.catName, !item.isActive && s.inactive]}>{item.name}</Text>
                  <Text style={s.catSub}>{item.productCount ?? 0} products</Text>
                </View>
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('AdminEditCategory',{categoryId: item.id})}>
                  <Icon name="create-outline" size={18} color={Colors.primary}/>
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={() => handleToggle(item)}>
                  <Icon name={item.isActive ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textSecondary}/>
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={() => handleDelete(item)}>
                  <Icon name="trash-outline" size={18} color={Colors.error}/>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary}/>}
          ListEmptyComponent={
            <View style={s.center}>
              <Icon name="layers-outline" size={60} color={Colors.border}/>
              <Text style={s.empty}>No categories yet</Text>
              <TouchableOpacity style={s.addFirstBtn} onPress={() => navigation.navigate('AdminAddCategory')}>
                <Text style={s.addFirstText}>Add First Category</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:60,gap:12},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:spacing.base,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  title:{fontSize:20,fontWeight:'800',color:Colors.textPrimary},
  addBtn:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:Colors.primary,borderRadius:borderRadius.lg,paddingHorizontal:spacing.md,paddingVertical:8},
  addBtnText:{color:Colors.white,fontWeight:'700',fontSize:14},
  list:{padding:spacing.sm},
  card:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.md,...shadow.sm,marginBottom:spacing.sm},
  cardInactive:{opacity:0.5},
  cardLeft:{flexDirection:'row',alignItems:'center',gap:spacing.sm,flex:1},
  catImg:{width:44,height:44,borderRadius:borderRadius.sm,backgroundColor:Colors.background},
  catImgPlaceholder:{alignItems:'center',justifyContent:'center'},
  catName:{fontSize:14,fontWeight:'700',color:Colors.textPrimary},
  inactive:{textDecorationLine:'line-through'},
  catSub:{fontSize:11,color:Colors.textSecondary,marginTop:2},
  actions:{flexDirection:'row',gap:4},
  iconBtn:{padding:8},
  empty:{fontSize:14,color:Colors.textSecondary,fontWeight:'600'},
  addFirstBtn:{backgroundColor:Colors.primary,borderRadius:borderRadius.lg,paddingHorizontal:20,paddingVertical:10},
  addFirstText:{color:Colors.white,fontWeight:'700'},
});
