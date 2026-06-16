// FILE: src/screens/admin/AdminUsersScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../theme/colors';
import { shadow, borderRadius } from '../../theme/spacing';
import { adminApi } from '../../api/admin';
import type { User } from '../../types/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TABS = ['All', 'Farmers', 'Buyers', 'Delivery'];
const TAB_WIDTH = SCREEN_WIDTH / TABS.length;

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  FARMER: { bg: Colors.successLight, color: Colors.primary },
  BUYER: { bg: Colors.infoLight, color: Colors.info },
  DELIVERY: { bg: Colors.warningLight, color: Colors.warning },
  ADMIN: { bg: Colors.errorLight, color: Colors.error },
};

const ROLE_MAP: Record<number, string | undefined> = {
  0: undefined,
  1: 'FARMER',
  2: 'BUYER',
  3: 'DELIVERY',
};

// ── UserRow sub-component ─────────────────────────────────────────────────────
interface UserRowProps {
  user: User;
  onMenu: () => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, onMenu }) => {
  const initials = ((user as any).name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const role = (user as any).role || 'BUYER';
  const roleStyle = ROLE_COLORS[role] || { bg: Colors.divider, color: Colors.textSecondary };
  const isBlocked = (user as any).isBlocked || (user as any).status === 'BLOCKED';

  return (
    <View style={[styles.userRow, isBlocked && styles.userRowBlocked]}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.userTopRow}>
          <Text style={styles.userName} numberOfLines={1}>{(user as any).name || 'Unknown'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
            <Text style={[styles.roleText, { color: roleStyle.color }]}>{role}</Text>
          </View>
        </View>
        <Text style={styles.userPhone}>{(user as any).phone || (user as any).email}</Text>
        <View style={styles.userBottomRow}>
          <Text style={styles.joinDate}>
            Joined {new Date((user as any).createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </Text>
          {isBlocked ? (
            <View style={styles.blockedBadge}><Text style={styles.blockedText}>Blocked</Text></View>
          ) : (
            <View style={styles.activeBadge}><Text style={styles.activeText}>Active</Text></View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={onMenu} style={styles.menuBtn}>
        <Text style={styles.menuBtnText}>⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const AdminUsersScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [activeTab, setActiveTab] = useState(0);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;

  const loadUsers = useCallback(async () => {
    try {
      const res: any = await adminApi.getUsers({ limit: 100 });
      setAllUsers(res.data?.items || []);
    } catch {
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const switchTab = (index: number) => {
    setActiveTab(index);
    Animated.timing(tabAnim, { toValue: index * TAB_WIDTH, duration: 200, useNativeDriver: false }).start();
  };

  const filteredUsers = allUsers.filter((u) => {
    const roleFilter = ROLE_MAP[activeTab];
    const matchesRole = roleFilter ? (u as any).role === roleFilter : true;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || (u as any).name?.toLowerCase().includes(q) || (u as any).phone?.includes(q);
    return matchesRole && matchesSearch;
  });

  const handleBlock = useCallback(async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setShowBlockConfirm(false);
    try {
      await adminApi.blockUser((selectedUser as any).id, 'Admin action');
      setAllUsers((prev) => prev.map((u) => (u as any).id === (selectedUser as any).id ? { ...u, isBlocked: true, status: 'BLOCKED' } as User : u));
      setShowMenu(false);
      setSelectedUser(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to block user.');
    } finally {
      setActionLoading(false);
    }
  }, [selectedUser]);

  const handleUnblock = useCallback(async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setShowMenu(false);
    try {
      await adminApi.unblockUser((selectedUser as any).id);
      setAllUsers((prev) => prev.map((u) => (u as any).id === (selectedUser as any).id ? { ...u, isBlocked: false, status: 'ACTIVE' } as User : u));
      setSelectedUser(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to unblock user.');
    } finally {
      setActionLoading(false);
    }
  }, [selectedUser]);

  const isSelectedBlocked = selectedUser ? ((selectedUser as any).isBlocked || (selectedUser as any).status === 'BLOCKED') : false;

  const renderUser = ({ item }: { item: User }) => (
    <UserRow
      user={item}
      onMenu={() => { setSelectedUser(item); setShowMenu(true); }}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={Colors.textHint}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={styles.tab} onPress={() => switchTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
        <Animated.View style={[styles.tabIndicator, { left: tabAnim }]} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlashList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(u) => (u as any).id}
          estimatedItemSize={80}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No users found</Text>
            </View>
          }
        />
      )}

      {/* User Menu Modal */}
      <Modal
        isVisible={showMenu}
        onBackdropPress={() => { setShowMenu(false); setSelectedUser(null); }}
        style={styles.modal}
      >
        <View style={styles.menuSheet}>
          <View style={styles.sheetHandle} />
          {selectedUser && (
            <>
              <Text style={styles.menuUserName}>{(selectedUser as any).name}</Text>
              <Text style={styles.menuUserPhone}>{(selectedUser as any).phone}</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('UserDetail', { userId: (selectedUser as any).id });
                }}
              >
                <Text style={styles.menuItemIcon}>👤</Text>
                <Text style={styles.menuItemText}>View Profile</Text>
              </TouchableOpacity>
              {!isSelectedBlocked ? (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => { setShowMenu(false); setShowBlockConfirm(true); }}
                >
                  <Text style={styles.menuItemIcon}>🚫</Text>
                  <Text style={[styles.menuItemText, { color: Colors.error }]}>Block User</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleUnblock}
                  disabled={actionLoading}
                >
                  <Text style={styles.menuItemIcon}>{actionLoading ? '⏳' : '✅'}</Text>
                  <Text style={[styles.menuItemText, { color: Colors.success }]}>Unblock User</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>

      {/* Block Confirmation */}
      <Modal
        isVisible={showBlockConfirm}
        onBackdropPress={() => setShowBlockConfirm(false)}
      >
        <View style={styles.confirmDialog}>
          <Text style={styles.confirmTitle}>Block User?</Text>
          <Text style={styles.confirmMessage}>
            Are you sure you want to block {(selectedUser as any)?.name}? They will not be able to access the app.
          </Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBlockConfirm(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.blockBtn} onPress={handleBlock} disabled={actionLoading}>
              {actionLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.blockBtnText}>Block</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AdminUsersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: Colors.white, ...shadow.sm },
  backText: { fontSize: 22, color: Colors.textPrimary, width: 32 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, margin: 12, borderRadius: borderRadius.lg, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, padding: 0 },
  clearBtn: { color: Colors.textHint, fontSize: 14, padding: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, position: 'relative' },
  tab: { width: TAB_WIDTH, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 13, color: Colors.textHint, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: 0, height: 2, width: TAB_WIDTH, backgroundColor: Colors.primary, borderRadius: 1 },
  listContent: { padding: 12, paddingBottom: 40 },
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: borderRadius.lg, padding: 12, marginBottom: 8, ...shadow.sm },
  userRowBlocked: { opacity: 0.65 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userAvatarText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  userTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  userName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  roleBadge: { borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  roleText: { fontSize: 10, fontWeight: '700' },
  userPhone: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  userBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  joinDate: { fontSize: 11, color: Colors.textHint, flex: 1 },
  blockedBadge: { backgroundColor: Colors.errorLight, borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  blockedText: { color: Colors.error, fontSize: 10, fontWeight: '600' },
  activeBadge: { backgroundColor: Colors.successLight, borderRadius: borderRadius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  activeText: { color: Colors.success, fontSize: 10, fontWeight: '600' },
  menuBtn: { padding: 8 },
  menuBtnText: { fontSize: 20, color: Colors.textSecondary },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 12 },
  modal: { justifyContent: 'flex-end', margin: 0 },
  menuSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  menuUserName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  menuUserPhone: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  menuItemIcon: { fontSize: 20, marginRight: 14, width: 28 },
  menuItemText: { fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  confirmDialog: { backgroundColor: Colors.white, borderRadius: borderRadius.xl, padding: 24, margin: 20 },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  confirmMessage: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  confirmActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderRadius: borderRadius.lg, paddingVertical: 13, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 15 },
  blockBtn: { flex: 1, borderRadius: borderRadius.lg, paddingVertical: 13, alignItems: 'center', backgroundColor: Colors.error },
  blockBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
