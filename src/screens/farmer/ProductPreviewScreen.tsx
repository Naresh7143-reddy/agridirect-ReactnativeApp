import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow, spacing } from '../../theme/spacing';
import { productsApi } from '../../api/products';
import { formatPrice } from '../../utils/format';
import type { Product } from '../../types/product';
import type { FarmerStackParamList } from '../../types/navigation';

type RouteP = RouteProp<FarmerStackParamList, 'ProductPreview'>;
type NavP   = NativeStackNavigationProp<FarmerStackParamList>;

export default function ProductPreviewScreen() {
  const route = useRoute<RouteP>();
  const navigation = useNavigation<NavP>();
  const { productId } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await productsApi.getFarmerProductById(productId);
      setProduct(res.data);
    } catch {
      try {
        const res = await productsApi.getById(productId);
        setProduct(res.data);
      } catch {}
    }
    finally { setLoading(false); }
  }, [productId]);

  const toggleAvailability = useCallback(async () => {
    if (!product) return;
    setToggling(true);
    try {
      await productsApi.toggleAvailability(product.id);
      setProduct(prev => prev ? { ...prev, isAvailable: !prev.isAvailable } : prev);
    } catch {
      Alert.alert('Error', 'Could not update availability');
    } finally {
      setToggling(false);
    }
  }, [product]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large"/></View>;
  if (!product) return <View style={s.center}><Text style={s.err}>Product not found</Text></View>;

  const images = product.images ?? [];
  const currentImg = images[imgIndex]?.url ?? product.primaryImageUrl ?? '';
  const stockVal = product.stockQuantity ?? product.stock;

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Icon name="arrow-back" size={22} color={Colors.textPrimary}/>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Product Preview</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditProduct',{productId})} style={s.editBtn}>
          <Icon name="create-outline" size={20} color={Colors.primary}/>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main image */}
        <View style={s.imageWrap}>
          {currentImg ? (
            <FastImage source={{uri: currentImg, priority: FastImage.priority.high}} style={s.mainImage} resizeMode={FastImage.resizeMode.cover}/>
          ) : (
            <View style={[s.mainImage, s.imagePlaceholder]}>
              <Icon name="image-outline" size={60} color={Colors.border}/>
            </View>
          )}
          {!product.isAvailable && (
            <View style={s.unavailableOverlay}>
              <Text style={s.unavailableText}>Not Available</Text>
            </View>
          )}
        </View>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <View style={s.thumbRow}>
            {images.map((img, i) => (
              <TouchableOpacity key={img.url} onPress={() => setImgIndex(i)}>
                <FastImage source={{uri: img.url}} style={[s.thumb, i === imgIndex && s.thumbActive]} resizeMode={FastImage.resizeMode.cover}/>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={s.content}>
          {/* Name & price */}
          <View style={s.card}>
            <Text style={s.productName}>{product.name}</Text>
            <View style={s.priceRow}>
              <Text style={s.price}>{formatPrice(product.price)}</Text>
              <Text style={s.unit}>per {product.unit}</Text>
            </View>
            <View style={s.tagsRow}>
              <TouchableOpacity
                style={[s.tag, {backgroundColor: product.isAvailable ? Colors.successLight : Colors.errorLight}]}
                onPress={toggleAvailability}
                disabled={toggling}
              >
                {toggling
                  ? <ActivityIndicator size="small" color={product.isAvailable ? Colors.success : Colors.error}/>
                  : <Text style={[s.tagText, {color: product.isAvailable ? Colors.success : Colors.error}]}>
                      {product.isAvailable ? '✓ Available — tap to disable' : '✗ Unavailable — tap to enable'}
                    </Text>
                }
              </TouchableOpacity>
              {product.isOrganic && (
                <View style={[s.tag, {backgroundColor: Colors.primary + '22'}]}>
                  <Text style={[s.tagText, {color: Colors.primary}]}>🌿 Organic</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stock & category */}
          <View style={s.card}>
            <View style={s.infoRow}>
              <Icon name="layers-outline" size={16} color={Colors.primary}/>
              <Text style={s.infoLabel}>Stock</Text>
              <Text style={s.infoVal}>{stockVal != null ? stockVal : 'N/A'} {product.unit}</Text>
            </View>
            {product.category && (
              <View style={s.infoRow}>
                <Icon name="pricetag-outline" size={16} color={Colors.primary}/>
                <Text style={s.infoLabel}>Category</Text>
                <Text style={s.infoVal}>{typeof product.category === 'string' ? product.category : (product.category as any)?.name}</Text>
              </View>
            )}
            {product.rating !== undefined && (
              <View style={s.infoRow}>
                <Icon name="star" size={16} color="#F59E0B"/>
                <Text style={s.infoLabel}>Rating</Text>
                <Text style={s.infoVal}>{product.rating.toFixed(1)} / 5</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {product.description ? (
            <View style={s.card}>
              <Text style={s.sectionTitle}>Description</Text>
              <Text style={s.description}>{product.description}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <TouchableOpacity style={s.editFullBtn} onPress={() => navigation.navigate('EditProduct',{productId})}>
            <Icon name="create-outline" size={18} color={Colors.white}/>
            <Text style={s.editFullBtnText}>Edit Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,alignItems:'center',justifyContent:'center'},
  err:{color:Colors.textSecondary},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing.base,backgroundColor:Colors.surface,borderBottomWidth:1,borderBottomColor:Colors.border},
  back:{padding:4},
  headerTitle:{fontSize:17,fontWeight:'700',color:Colors.textPrimary},
  editBtn:{padding:4},
  imageWrap:{position:'relative'},
  mainImage:{width:'100%',height:280,backgroundColor:Colors.divider},
  imagePlaceholder:{alignItems:'center',justifyContent:'center'},
  unavailableOverlay:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,0.5)',alignItems:'center',justifyContent:'center'},
  unavailableText:{color:'#fff',fontSize:18,fontWeight:'800'},
  thumbRow:{flexDirection:'row',gap:8,padding:spacing.sm,backgroundColor:Colors.surface},
  thumb:{width:56,height:56,borderRadius:borderRadius.sm,borderWidth:2,borderColor:'transparent'},
  thumbActive:{borderColor:Colors.primary},
  content:{padding:spacing.base,gap:spacing.md},
  card:{backgroundColor:Colors.surface,borderRadius:borderRadius.lg,padding:spacing.base,...shadow.sm},
  productName:{fontSize:20,fontWeight:'800',color:Colors.textPrimary,marginBottom:8},
  priceRow:{flexDirection:'row',alignItems:'baseline',gap:6},
  price:{fontSize:24,fontWeight:'800',color:Colors.primary},
  unit:{fontSize:14,color:Colors.textSecondary},
  tagsRow:{flexDirection:'row',gap:8,marginTop:10},
  tag:{borderRadius:borderRadius.full,paddingHorizontal:10,paddingVertical:4},
  tagText:{fontSize:12,fontWeight:'600'},
  infoRow:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:6,borderBottomWidth:1,borderBottomColor:Colors.divider},
  infoLabel:{flex:1,fontSize:13,color:Colors.textSecondary},
  infoVal:{fontSize:13,fontWeight:'600',color:Colors.textPrimary},
  sectionTitle:{fontSize:14,fontWeight:'700',color:Colors.textPrimary,marginBottom:6},
  description:{fontSize:14,color:Colors.textSecondary,lineHeight:22},
  editFullBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:Colors.primary,borderRadius:borderRadius.lg,padding:spacing.base,marginBottom:spacing.xl},
  editFullBtnText:{color:Colors.white,fontWeight:'700',fontSize:15},
});
