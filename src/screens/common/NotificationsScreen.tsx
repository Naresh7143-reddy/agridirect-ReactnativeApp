// FILE: src/screens/common/NotificationsScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme/colors';
import { borderRadius, shadow } from '../../theme/spacing';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = 'order' | 'payment' | 'delivery' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  bucket: 'Today' | 'Yesterday' | 'Earlier';
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'Order Confirmed!',
    body: 'Your order #ORD-001 from Green Valley Farm has been confirmed and is being prepared.',
    timestamp: '10:30 AM',
    read: false,
    bucket: 'Today',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Successful',
    body: 'Payment of ₹340 for order #ORD-001 was processed successfully via UPI.',
    timestamp: '10:28 AM',
    read: false,
    bucket: 'Today',
  },
  {
    id: '3',
    type: 'delivery',
    title: 'Out for Delivery',
    body: 'Your order #ORD-002 is out for delivery. Expected arrival between 2–4 PM.',
    timestamp: '9:15 AM',
    read: false,
    bucket: 'Today',
  },
  {
    id: '4',
    type: 'system',
    title: 'Profile Verified',
    body: 'Your account has been verified. You can now place unlimited orders.',
    timestamp: '8:00 AM',
    read: true,
    bucket: 'Today',
  },
  {
    id: '5',
    type: 'order',
    title: 'Order Delivered',
    body: 'Order #ORD-003 has been delivered successfully. Rate your experience!',
    timestamp: '3:45 PM',
    read: true,
    bucket: 'Yesterday',
  },
  {
    id: '6',
    type: 'payment',
    title: 'Refund Processed',
    body: 'A refund of ₹120 has been initiated for order #ORD-000. Expect 3–5 business days.',
    timestamp: '1:20 PM',
    read: true,
    bucket: 'Yesterday',
  },
  {
    id: '7',
    type: 'delivery',
    title: 'Delivery Partner Assigned',
    body: 'Ravi Kumar will be delivering your order #ORD-004. Track live on the order page.',
    timestamp: '11:00 AM',
    read: true,
    bucket: 'Earlier',
  },
  {
    id: '8',
    type: 'system',
    title: 'New Feature: Wishlist',
    body: 'You can now save products to your wishlist and get notified when prices drop!',
    timestamp: 'Jun 2',
    read: true,
    bucket: 'Earlier',
  },
  {
    id: '9',
    type: 'order',
    title: 'Order Cancelled',
    body: 'Order #ORD-005 was cancelled as per your request. Refund will be processed.',
    timestamp: 'Jun 1',
    read: true,
    bucket: 'Earlier',
  },
];

// ─── Color / icon maps ────────────────────────────────────────────────────────

const NOTIF_COLORS: Record<NotifType, string> = {
  order: Colors.success,
  payment: Colors.secondary,
  delivery: Colors.info,
  system: Colors.textHint,
};

const NOTIF_ICONS: Record<NotifType, string> = {
  order: 'cart-outline',
  payment: 'card-outline',
  delivery: 'bicycle-outline',
  system: 'settings-outline',
};

// ─── NotificationCard ─────────────────────────────────────────────────────────

interface CardProps {
  item: Notification;
  index: number;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationCard: React.FC<CardProps> = ({ item, index, onRead, onDelete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const bgAnim = useRef(new Animated.Value(item.read ? 0 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = useCallback(() => {
    if (!item.read) {
      Animated.timing(bgAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      onRead(item.id);
    }
  }, [item.read, item.id, bgAnim, onRead]);

  const handleDelete = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(150, 'easeInEaseOut', 'opacity'),
    );
    onDelete(item.id);
  }, [item.id, onDelete]);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.surface, Colors.successLight],
  });

  const color = NOTIF_COLORS[item.type];

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
        <Animated.View
          style={[
            styles.card,
            shadow.sm,
            !item.read && styles.cardUnread,
            { backgroundColor: bgColor as any },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: color + '22' }]}>
            <Icon name={NOTIF_ICONS[item.type]} size={20} color={color} />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTop}>
              <Text
                style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
            <Text style={styles.cardText} numberOfLines={2}>
              {item.body}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={16} color={Colors.textHint} />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const deleteNotif = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const buckets = ['Today', 'Yesterday', 'Earlier'] as const;
  const sections = buckets
    .map((bucket) => ({
      title: bucket,
      data: notifications.filter((n) => n.bucket === bucket),
    }))
    .filter((s) => s.data.length > 0);

  const renderItem = useCallback(
    ({ item, index }: { item: Notification; index: number }) => (
      <NotificationCard
        item={item}
        index={index}
        onRead={markRead}
        onDelete={deleteNotif}
      />
    ),
    [markRead, deleteNotif],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <Text style={styles.sectionHeader}>{section.title}</Text>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {'Notifications'}
          {unreadCount > 0 ? (
            <Text style={styles.badge}>{` (${unreadCount})`}</Text>
          ) : null}
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="notifications-off-outline" size={72} color={Colors.border} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>We'll let you know when something arrives</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginLeft: 8 },
  badge: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  markAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 32 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 8,
    backgroundColor: Colors.surface,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  cardTitleUnread: { fontWeight: '700' },
  timestamp: { fontSize: 11, color: Colors.textHint },
  cardText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  deleteBtn: { padding: 4, marginLeft: 4 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
});

export default NotificationsScreen;
