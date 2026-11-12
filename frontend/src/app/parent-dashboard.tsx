import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api, ApiError, clearSession, errorText, getUser } from '../lib/api';

// FONTS - Rupee Ranger -> Samarkan, All Others -> Rubik
const FONT_LOGO = 'Samarkan';
const FONT_BODY = 'Rubik';

// NEW COLOR COMBO - Inspired by Madhubani Art
const COLORS = {
  navy: '#0A235A',
  cream: '#FFF8E6',
  terracotta: '#C96F4A',
  mustard: '#E8A317',
  sage: '#8FA98F',
  card: '#FFF8E6',
};

const CAT_COLORS = ['#E8A317', '#0A235A', '#8FA98F', '#C96F4A', '#60A5FA', '#A78BFA'];

// One linked teen, built from the backend. Money is shown in rupees (backend sends paise).
type Child = {
  id: string; name: string; email: string;
  balance: number; spentToday: number; dailyLimit: number; blocked: string[];
  categories: { label: string; amt: number; color: string }[];
  history: { label: string; amt: string; time: string }[];
};

const toRs = (paise: number) => Math.round(paise) / 100;
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

async function loadChild(t: { id: string; name: string; email: string }): Promise<Child> {
  const [w, tx] = await Promise.all([
    api(`/wallet?teenId=${t.id}`),
    api(`/transactions?teenId=${t.id}&limit=50`),
  ]);
  const txs: any[] = tx.transactions || [];
  const byCat: Record<string, number> = {};
  txs.filter(x => x.type === 'spend').forEach(x => {
    const k = cap(x.category || 'Other');
    byCat[k] = (byCat[k] || 0) + Math.abs(toRs(x.amount_paise));
  });
  const categories = Object.keys(byCat).map((k, i) => ({ label: k, amt: Math.round(byCat[k]), color: CAT_COLORS[i % CAT_COLORS.length] }));
  const history = txs.slice(0, 30).map(x => {
    const a = toRs(x.amount_paise);
    const label = x.type === 'topup' ? 'Top-up' : x.type === 'save' ? 'Saved to goal' : `${cap(x.category || 'Spend')}${x.merchant ? ' - ' + x.merchant : ''}`;
    return { label, amt: `${a >= 0 ? '+' : '-'} Rs.${Math.abs(a)}`, time: new Date(x.created_at).toLocaleString() };
  });
  return {
    id: t.id, name: t.name, email: t.email,
    balance: toRs(w.balancePaise), spentToday: toRs(w.spentTodayPaise), dailyLimit: toRs(w.dailyLimitPaise),
    blocked: w.blockedCategories || [], categories, history,
  };
}

const FONT_SCALE: any = { XS: 0.8, S: 0.9, M: 1, L: 1.15, XL: 1.3, XXL: 1.45 };

export default function ParentDashboard() {
  const router = useRouter();
  const [CHILDREN, setCHILDREN] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'home' | 'allowance' | 'overview' | 'history'>('home');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [topupAmt, setTopupAmt] = useState('');
  // A PayPal order that was opened in the browser and still needs to be confirmed
  const [pendingOrder, setPendingOrder] = useState<{ orderId: string; teenId: string; display: string } | null>(null);

  const [parentName, setParentName] = useState('Parent');
  const [parentEmail, setParentEmail] = useState('');

  // ADD CHILD STATES - the parent links an existing teen account by email
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildEmail, setNewChildEmail] = useState('');

  // EDIT LIMITS STATES
  const [showEditLimits, setShowEditLimits] = useState(false);
  const [editingChildId, setEditingChildId] = useState('');
  const [editDaily, setEditDaily] = useState('');
  const [editBlocked, setEditBlocked] = useState('');

  const [notifOn, setNotifOn] = useState(true);
  const [notifVia, setNotifVia] = useState('App');
  const [vibration, setVibration] = useState(true);
  const [sound, setSound] = useState(true);
  const [appLock, setAppLock] = useState('Fingerprint');
  const [fontSize, setFontSize] = useState('M');
  const [brightness, setBrightness] = useState(70);
  const [theme, setTheme] = useState('Dark');
  const [lang, setLang] = useState('English');

  const logout = async () => { await clearSession(); setShowProfile(false); router.replace('/'); };

  const loadAll = useCallback(async () => {
    setLoadError('');
    try {
      const { teens } = await api('/links');
      const kids = await Promise.all((teens || []).map((t: any) => loadChild(t)));
      setCHILDREN(kids);
      setSelectedId(prev => (kids.find(k => k.id === prev) ? prev : kids[0]?.id || ''));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { await clearSession(); router.replace('/'); return; }
      setLoadError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      if (u) { setParentName(u.name); setParentEmail(u.email); }
      loadAll();
    })();
  }, [loadAll]);

  const child: Child | undefined = CHILDREN.find(c => c.id === selectedId);
  const fs = FONT_SCALE[fontSize];
  const T = (size: number) => ({ fontSize: size * fs, fontFamily: FONT_BODY });
  const dimOpacity = (100 - brightness) / 220;

  const Row = ({ label, children }: any) => (
    <View style={styles.setRow}><Text style={[styles.setLabel, T(16)]}>{label}</Text><View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>{children}</View></View>
  );
  const Chip = ({ active, label, onPress }: any) => (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, T(13), active && styles.chipTextActive]}>{label}</Text></Pressable>
  );
  const Toggle = ({ on, onPress }: any) => (
    <Pressable onPress={onPress} style={[styles.toggle, on && styles.toggleOn]}><View style={[styles.toggleDot, on && styles.toggleDotOn]} /></Pressable>
  );

  const Pie = (cats: any[]) => {
    const total = cats.reduce((a: number, b: any) => a + b.amt, 0);
    if (total <= 0) return <Text style={[styles.muted, T(13), { marginTop: 8 }]}>No spending yet.</Text>;
    return (
      <View>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 10 }}>
          {cats.map((c: any, i: number) => (
            <View key={i} style={{ flex: Math.max(c.amt, 0.01), height: 26, backgroundColor: c.color, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 11 * fs, fontWeight: '700', fontFamily: FONT_BODY }}>{Math.round((c.amt / total) * 100)}%</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          {cats.map((c: any, i: number) => <Text key={i} style={[styles.muted, T(12)]}>● {c.label} Rs.{c.amt}</Text>)}
        </View>
      </View>
    );
  };

  // ADD CHILD - links an existing teen account by the teen's email
  const handleAddChild = async () => {
    const email = newChildEmail.trim().toLowerCase();
    if (!email) { Alert.alert('Teen email needed', "Enter the email your teen signed up with."); return; }
    setBusy(true);
    try {
      const { teen } = await api('/links', { method: 'POST', body: { teenEmail: email } });
      setNewChildEmail(''); setShowAddChild(false);
      await loadAll();
      setSelectedId(teen.id); setTab('home');
      Alert.alert('Linked', `${teen.name} is now linked to your account.`);
    } catch (e) {
      Alert.alert('Could not add teen', errorText(e));
    } finally { setBusy(false); }
  };

  // OPEN EDIT LIMITS - Fill Current Values
  const openEditLimits = (c: Child) => {
    setEditingChildId(c.id);
    setEditDaily(String(c.dailyLimit));
    setEditBlocked(c.blocked.join(', '));
    setShowEditLimits(true);
  };

  // SAVE LIMITS - sends the new rules to the backend; the backend enforces them on every payment
  const saveLimits = async () => {
    const daily = Number(editDaily);
    if (!Number.isFinite(daily) || daily < 0) { Alert.alert('Check the limit', 'Daily limit must be a number.'); return; }
    const blockedCategories = editBlocked.split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    setBusy(true);
    try {
      await api(`/rules/${editingChildId}`, { method: 'PUT', body: { dailyLimitPaise: Math.round(daily * 100), blockedCategories } });
      setShowEditLimits(false);
      await loadAll();
      Alert.alert('Saved', 'New rules are active. Your teen cannot go past them.');
    } catch (e) {
      Alert.alert('Could not save', errorText(e));
    } finally { setBusy(false); }
  };

  // TOP-UP STEP 1 - create a PayPal order and open PayPal in the browser
  const startTopUp = async (c: Child) => {
    const amt = Number(topupAmt);
    if (!Number.isFinite(amt) || amt < 1) { Alert.alert('Enter an amount', 'Type how many rupees to add (for example 100).'); return; }
    setBusy(true);
    try {
      const o = await api('/topup/orders', { method: 'POST', body: { teenId: c.id, amountPaise: Math.round(amt * 100) } });
      setPendingOrder({ orderId: o.orderId, teenId: c.id, display: o.display });
      await WebBrowser.openBrowserAsync(o.approvalUrl);
      Alert.alert('Finished paying?', 'After you approve the payment in PayPal, come back here and tap "I have paid - add money".');
    } catch (e) {
      Alert.alert('Top-up failed', errorText(e));
    } finally { setBusy(false); }
  };

  // TOP-UP STEP 2 - capture the approved order; the backend then credits the wallet
  const confirmTopUp = async () => {
    if (!pendingOrder) return;
    setBusy(true);
    try {
      const r = await api(`/topup/orders/${pendingOrder.orderId}/capture`, { method: 'POST' });
      setPendingOrder(null); setTopupAmt('');
      await loadAll();
      Alert.alert('Money added', `Rs.${toRs(r.addedPaise)} added. New balance Rs.${toRs(r.balancePaise)}.`);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ORDER_NOT_APPROVED') Alert.alert('Not approved yet', 'Finish the payment in PayPal first, then tap the button again.');
      else Alert.alert('Could not add money', errorText(e));
    } finally { setBusy(false); }
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={COLORS.mustard} /><Text style={{ color: '#FFEFC2', marginTop: 12, fontFamily: FONT_BODY }}>Loading your family... (the server may take up to a minute to wake up)</Text></View>;
  }

  return (
    <ImageBackground source={require('../../assets/fishBg.jpeg')} style={{ flex: 1 , width:'100%', height:'100%'}} imageStyle={{ opacity: 0.35 }} resizeMode="cover">
    <View style={[styles.container, { backgroundColor: theme === 'Dark' ? 'rgba(10,35,90,0.45)' : 'rgba(255,248,230,0.85)' }]}>
      {/* HEADER - CENTERED, RUPEE RANGER IN SAMARKAN */}
      <View style={styles.header}>
        <Pressable onPress={() => setShowProfile(true)} style={styles.iconBtn}><Text style={{ fontSize: 20 }}>👤</Text></Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.logo}>Rupee Ranger</Text>
          <Text style={[styles.logoSub, T(26)]}>Parent Dashboard</Text>
        </View>
        <Pressable onPress={() => setShowSettings(true)} style={styles.iconBtn}><Text style={{ fontSize: 20 }}>⚙️</Text></Pressable>
      </View>

      {/* CHILD SELECTOR */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 92 }} contentContainerStyle={{ gap: 14, paddingHorizontal: 16, paddingVertical: 4 }}>
        {CHILDREN.map(c => (
          <Pressable key={c.id} onPress={() => { setSelectedId(c.id); setTab('home'); }} style={{ alignItems: 'center' }}>
            <View style={[styles.avatar, selectedId === c.id && styles.avatarActive]}>
              <Text style={[styles.avatarTxt, T(24)]}>{c.name[0]}</Text>
            </View>
            <Text style={[styles.childName, T(12), selectedId === c.id && styles.childNameActive]}>{c.name}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setShowAddChild(true)} style={{ alignItems: 'center' }}><View style={[styles.avatar, { borderStyle: 'dashed' }]}><Text style={[styles.avatarTxt, T(24)]}>+</Text></View><Text style={[styles.childName, T(12)]}>Add</Text></Pressable>
      </ScrollView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {loadError ? (
          <View style={{ padding: 16 }}><View style={styles.card}>
            <Text style={[styles.cardTitle, T(16)]}>Could not load</Text>
            <Text style={[styles.muted, T(14), { marginTop: 6 }]}>{loadError}</Text>
            <TouchableOpacity style={[styles.sendBtn, { marginTop: 12 }]} onPress={() => { setLoading(true); loadAll(); }}><Text style={[T(14), { color: '#0A235A', fontWeight: '800' }]}>Try again</Text></TouchableOpacity>
          </View></View>
        ) : !child ? (
          <View style={{ padding: 16 }}><View style={styles.card}>
            <Text style={[styles.cardTitle, T(16)]}>👨‍👩‍👧 Link your teen</Text>
            <Text style={[styles.muted, T(14), { marginTop: 6 }]}>Your teen signs up in the app first. Then tap + Add above and enter the email they used. You can then top up their wallet and set their spending rules.</Text>
            <TouchableOpacity style={[styles.sendBtn, { marginTop: 12 }]} onPress={() => setShowAddChild(true)}><Text style={[T(14), { color: '#0A235A', fontWeight: '800' }]}>+ Add teen by email</Text></TouchableOpacity>
          </View></View>
        ) : (<>
        {tab === 'home' && (
          <View style={{ padding: 16, gap: 14 }}>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View><Text style={[styles.bigName, T(21)]}>{child.name}</Text><Text style={[styles.muted, T(13)]}>{child.email}</Text></View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}><Text style={[styles.statLabel, T(12)]}>Balance</Text><Text style={[styles.statVal, T(18)]}>Rs.{child.balance}</Text></View>
                <View style={styles.stat}><Text style={[styles.statLabel, T(12)]}>Spent today</Text><Text style={[styles.statVal, T(18)]}>Rs.{child.spentToday}</Text></View>
                <View style={styles.stat}><Text style={[styles.statLabel, T(12)]}>Daily limit</Text><Text style={[styles.statVal, T(18)]}>Rs.{child.dailyLimit}</Text></View>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={[styles.cardTitle, T(16)]}>Where the money went</Text>
              {child.categories.length === 0 && <Text style={[styles.muted, T(13), { marginTop: 8 }]}>No spending yet.</Text>}
              {(() => { const tot = child.categories.reduce((a, b) => a + b.amt, 0); return child.categories.map((c, i) => (
                <View key={i} style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.muted, T(14)]}>{c.label}</Text><Text style={[styles.bold, T(14)]}>Rs.{c.amt}</Text></View>
                  <View style={styles.barBg}><View style={[styles.barFill, { width: `${tot ? (c.amt / tot) * 100 : 0}%`, backgroundColor: c.color }]} /></View>
                </View>
              )); })()}
              <Text style={[styles.cardTitle, T(16), { marginTop: 16 }]}>Spending - Pie Chart</Text>
              {Pie(child.categories)}
            </View>
          </View>
        )}

        {tab === 'allowance' && (
          <View style={{ padding: 16, gap: 14 }}>
            {CHILDREN.map(c => {
              const dailyPct = c.dailyLimit > 0 ? Math.min(100, (c.spentToday / c.dailyLimit) * 100) : 100;
              const waiting = pendingOrder && pendingOrder.teenId === c.id;
              return (
                <View key={c.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.bigName, T(20)]}>{c.name}</Text><Text style={[styles.bold, T(16)]}>Rs.{c.balance}</Text></View>
                  <Text style={[styles.muted, T(14)]}>{c.email}</Text>
                  <Text style={[styles.cardTitle, T(15), { marginTop: 12 }]}>💳 Add money (PayPal sandbox)</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                    <TextInput style={[styles.input, { flex: 1, fontFamily: FONT_BODY, fontSize: 15 * fs }]} placeholder="Amount Rs." keyboardType="numeric" value={selectedId === c.id ? topupAmt : ''} onChangeText={(t) => { setSelectedId(c.id); setTopupAmt(t); }} />
                    <TouchableOpacity disabled={busy} style={[styles.sendBtn, busy && { opacity: 0.5 }]} onPress={() => startTopUp(c)}><Text style={[T(14), { color: '#0A235A', fontWeight: '800' }]}>Add Money</Text></TouchableOpacity>
                  </View>
                  {waiting && (
                    <View style={{ backgroundColor: '#FFEFC2', borderRadius: 12, padding: 12, marginTop: 8 }}>
                      <Text style={[styles.muted, T(13)]}>PayPal order for {pendingOrder!.display} is waiting. Approve it in PayPal, then confirm here.</Text>
                      <TouchableOpacity disabled={busy} style={[styles.sendBtn, { marginTop: 8 }, busy && { opacity: 0.5 }]} onPress={confirmTopUp}><Text style={[T(14), { color: '#0A235A', fontWeight: '800' }]}>I have paid - add money</Text></TouchableOpacity>
                    </View>
                  )}
                  <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[styles.cardTitle, T(15)]}>🚫 Rules</Text>
                      <Pressable onPress={() => openEditLimits(c)}><Text style={[styles.bold, T(13), { color: '#0A235A' }]}>Edit →</Text></Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}><Text style={[styles.muted, T(14)]}>Daily Limit</Text><Text style={[styles.bold, T(14)]}>Rs.{c.spentToday} / Rs.{c.dailyLimit} today</Text></View>
                    <View style={styles.barBg}><View style={[styles.barFill, { width: `${dailyPct}%`, backgroundColor: dailyPct >= 90 ? '#DC2626' : dailyPct >= 70 ? '#E8A317' : '#8FA98F' }]} /></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}><Text style={[styles.muted, T(14)]}>Blocked categories</Text><Text style={[styles.bold, T(14), { flex: 1, textAlign: 'right' }]}>{c.blocked.length ? c.blocked.join(', ') : 'None'}</Text></View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {tab === 'overview' && (
          <View style={{ padding: 16, gap: 14 }}>
            <Text style={[styles.sectionTitle, T(18)]}>All Children Overview</Text>
            {CHILDREN.map(c => (
              <Pressable key={c.id} onPress={() => { setSelectedId(c.id); setTab('home'); }} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.bigName, T(20)]}>{c.name}</Text><Text style={[styles.bold, T(16)]}>Rs.{c.balance}</Text></View>
                <Text style={[styles.muted, T(13)]}>Spent today Rs.{c.spentToday} • Limit Rs.{c.dailyLimit}</Text>
                <Text style={[styles.cardTitle, T(15), { marginTop: 12 }]}>{c.name}'s Pie Chart</Text>
                {Pie(c.categories)}
              </Pressable>
            ))}
            <View style={styles.card}><Text style={[styles.bigName, T(20)]}>Total Family</Text><Text style={[styles.statVal, T(20)]}>Rs.{CHILDREN.reduce((a, b) => a + b.balance, 0)}</Text><Text style={[styles.muted, T(13)]}>Combined Balance</Text></View>
          </View>
        )}

        {tab === 'history' && (
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={[styles.sectionTitle, T(18)]}>History - {child.name}</Text>
            {child.history.length === 0 && <View style={styles.card}><Text style={[styles.muted, T(14)]}>Nothing yet.</Text></View>}
            {child.history.map((h, i) => (
              <View key={i} style={styles.card}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.bold, T(15)]}>{h.label}</Text><Text style={[styles.bold, T(15), { color: h.amt.includes('+') ? '#16A34A' : '#DC2626' }]}>{h.amt}</Text></View><Text style={[styles.muted, T(13)]}>{h.time}</Text></View>
            ))}
          </View>
        )}
        </>)}
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottom}>
        <Pressable onPress={() => setTab('home')} style={styles.navItem}><Text style={{ fontSize: 20 }}>🏠</Text><Text style={[styles.navTxt, T(10), tab === 'home' && styles.navActive]}>HOME</Text></Pressable>
        <Pressable onPress={() => setTab('allowance')} style={styles.navItem}><Text style={{ fontSize: 20 }}>💰</Text><Text style={[styles.navTxt, T(10), tab === 'allowance' && styles.navActive]}>Money</Text></Pressable>
        <Pressable onPress={() => { setLoading(true); loadAll(); }} style={styles.qrBtn}><Text style={{ fontSize: 26 }}>🔄</Text></Pressable>
        <Pressable onPress={() => setTab('overview')} style={styles.navItem}><Text style={{ fontSize: 20 }}>📊</Text><Text style={[styles.navTxt, T(10), tab === 'overview' && styles.navActive]}>Overview</Text></Pressable>
        <Pressable onPress={() => setTab('history')} style={styles.navItem}><Text style={{ fontSize: 20 }}>🕒</Text><Text style={[styles.navTxt, T(10), tab === 'history' && styles.navActive]}>History</Text></Pressable>
      </View>

      {/* EDIT RULES MODAL */}
      <Modal visible={showEditLimits} transparent animationType="fade">
        <View style={styles.centerWrap}><View style={styles.popup}>
          <Text style={[styles.drawerTitle, T(20)]}>🚫 Set Spending Rules</Text>
          <Text style={[styles.muted, T(13), { marginTop: 4 }]}>Your teen cannot go past these. The server checks every payment.</Text>
          <Text style={[styles.muted, T(14)]}>Daily Limit (Rs.)</Text><TextInput style={[styles.input, T(15)]} value={editDaily} onChangeText={setEditDaily} placeholder="e.g. 500" keyboardType="numeric" />
          <Text style={[styles.muted, T(14)]}>Blocked categories (comma separated)</Text><TextInput style={[styles.input, T(15)]} value={editBlocked} onChangeText={setEditBlocked} placeholder="e.g. gaming, snacks" autoCapitalize="none" />
          <TouchableOpacity disabled={busy} style={[styles.sendBtn, busy && { opacity: 0.5 }]} onPress={saveLimits}><Text style={[T(15), { fontWeight: '800', color: '#0A235A' }]}>Save Rules</Text></TouchableOpacity>
          <Pressable onPress={() => setShowEditLimits(false)} style={{ marginTop: 10, alignItems: 'center' }}><Text style={T(14)}>Cancel</Text></Pressable>
        </View></View>
      </Modal>

      {/* PROFILE DRAWER */}
      <Modal visible={showProfile} transparent animationType="slide">
        <View style={styles.drawerWrap}>
          <View style={styles.drawerLeft}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.drawerTitle, T(21)]}>Profile</Text><Pressable onPress={() => setShowProfile(false)}><Text style={{ fontSize: 20 }}>✕</Text></Pressable></View>
              <View style={{ alignItems: 'center', marginTop: 16 }}><View style={[styles.avatar, { width: 80, height: 80, borderRadius: 40 }]}><Text style={{ fontSize: 32, fontWeight: '800', fontFamily: FONT_BODY }}>{(parentName || 'P')[0]}</Text></View><Text style={[styles.bigName, T(20)]}>{parentName}</Text><Text style={[styles.muted, T(14)]}>{parentEmail}</Text></View>
              <Text style={[styles.cardTitle, T(16), { marginTop: 20 }]}>Accounts Attached</Text>
              {CHILDREN.map(c => <View key={c.id} style={styles.attachRow}><Text style={[styles.bold, T(15)]}>{c.name}</Text><Text style={[styles.muted, T(14)]}>{c.email}</Text></View>)}
              <Pressable onPress={() => { setShowProfile(false); setTimeout(() => setShowAddChild(true), 200); }} style={styles.attachRow}><Text style={[styles.bold, T(15)]}>+ Add Child</Text></Pressable>
              <Pressable onPress={logout} style={[styles.logoutBtn, { marginTop: 20 }]}><Text style={[T(14), { fontWeight: '700' }]}>Logout</Text></Pressable>
            </ScrollView>
          </View>
          <Pressable style={{ flex: 1 }} onPress={() => setShowProfile(false)} />
        </View>
      </Modal>

      {/* SETTINGS DRAWER (appearance only - saved on this screen) */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.drawerWrap}><Pressable style={{ flex: 1 }} onPress={() => setShowSettings(false)} /><View style={styles.drawerRight}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.drawerTitle, T(21)]}>SETTINGS</Text><Pressable onPress={() => setShowSettings(false)}><Text style={{ fontSize: 20 }}>✕</Text></Pressable></View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingBottom: 30 }}>
            <Text style={[styles.cardTitle, T(17)]}>Notifications</Text>
            <Row label="Notifications"><Toggle on={notifOn} onPress={() => setNotifOn(!notifOn)} /></Row>
            {notifOn && <><Row label="Via">{['Email', 'App', 'SMS'].map(v => <Chip key={v} label={v} active={notifVia === v} onPress={() => setNotifVia(v)} />)}</Row>
              <Row label="Vibration"><Toggle on={vibration} onPress={() => setVibration(!vibration)} /></Row>
              <Row label="Sound"><Toggle on={sound} onPress={() => setSound(!sound)} /></Row></>}
            <Text style={[styles.cardTitle, T(17), { marginTop: 16 }]}>App Lock</Text>
            <Row label="Lock Type">{['None', 'Pattern', 'Numeric', 'Fingerprint', 'Face Scan'].map(l => <Chip key={l} label={l} active={appLock === l} onPress={() => setAppLock(l)} />)}</Row>
            <Text style={[styles.cardTitle, T(17), { marginTop: 16 }]}>App Appearance</Text>
            <Row label="Font Size">{['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(f => <Chip key={f} label={f} active={fontSize === f} onPress={() => setFontSize(f)} />)}</Row>
            <Row label={`Brightness ${brightness}%`}><Chip label="-" active onPress={() => setBrightness(Math.max(10, brightness - 10))} /><Chip label="+" active onPress={() => setBrightness(Math.min(100, brightness + 10))} /></Row>
            <Row label="Theme"><Chip label="Light" active={theme === 'Light'} onPress={() => setTheme('Light')} /><Chip label="Dark" active={theme === 'Dark'} onPress={() => setTheme('Dark')} /></Row>
            <Row label="Language">{['English', 'Hindi', 'French', 'Spanish', 'Tamil'].map(l => <Chip key={l} label={l} active={lang === l} onPress={() => setLang(l)} />)}</Row>
          </ScrollView>
        </View></View>
      </Modal>

      {/* ADD CHILD MODAL - link by email */}
      <Modal visible={showAddChild} transparent animationType="fade">
        <View style={styles.centerWrap}><View style={styles.popup}>
          <Text style={[styles.drawerTitle, T(20)]}>+ Add Teen</Text>
          <Text style={[styles.muted, T(13)]}>Your teen must have signed up in the app already. Enter the email they used.</Text>
          <Text style={[styles.muted, T(14)]}>Teen's email *</Text><TextInput style={[styles.input, T(15)]} value={newChildEmail} onChangeText={setNewChildEmail} placeholder="teen@example.com" keyboardType="email-address" autoCapitalize="none" />
          <TouchableOpacity disabled={busy} style={[styles.sendBtn, busy && { opacity: 0.5 }]} onPress={handleAddChild}><Text style={[T(15), { fontWeight: '800', color: '#0A235A' }]}>Link Teen</Text></TouchableOpacity>
          <Pressable onPress={() => setShowAddChild(false)} style={{ marginTop: 10, alignItems: 'center' }}><Text style={T(14)}>Cancel</Text></Pressable>
        </View></View>
      </Modal>

      {brightness < 100 && <View pointerEvents="none" style={[styles.dimOverlay, { opacity: dimOpacity }]} />}
    </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 44 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  iconBtn: { width: 46, height: 46, backgroundColor: '#FFEFC2', borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 46, fontFamily: FONT_LOGO, color: '#ffc107eb', textAlign: 'center', lineHeight: 50 , textShadowColor: '#000000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6},
  logoSub: { color: '#FFEFC2', textAlign: 'center', fontWeight: '700', marginTop: 2 },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  avatarActive: { borderColor: '#E8A317' }, avatarTxt: { fontWeight: '800', color: '#0A235A' },
  dot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', bottom: 2, right: 2, borderWidth: 2, borderColor: '#0A235A' },
  childName: { color: '#FFEFC2', marginTop: 4, fontWeight: '700' }, childNameActive: { color: '#E8A317', fontWeight: '800' },
  card: { backgroundColor: '#FFF8E6', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  bigName: { fontWeight: '800', color: '#0A235A' }, muted: { color: '#64748B' }, bold: { fontWeight: '700', color: '#0A235A' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10 }, statLabel: { color: '#64748B' }, statVal: { fontWeight: '800', color: '#0A235A' },
  cardTitle: { fontWeight: '800', color: '#0A235A' }, sectionTitle: { fontWeight: '800', color: '#FFEFC2' },
  barBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, marginTop: 4, overflow: 'hidden' }, barFill: { height: 8, borderRadius: 4 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4, marginBottom: 8 },
  sendBtn: { backgroundColor: '#E8A317', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  bottom: { flexDirection: 'row', backgroundColor: '#FFF8E6', paddingHorizontal: 8, paddingVertical: 8, paddingBottom: 20, alignItems: 'center', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  navItem: { flex: 1, alignItems: 'center' }, navTxt: { fontWeight: '700', color: '#64748B' }, navActive: { color: '#0A235A' },
  qrBtn: { width: 58, height: 58, backgroundColor: '#E8A317', borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginTop: -30, borderWidth: 3, borderColor: '#FFF8E6' },
  drawerWrap: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  drawerLeft: { width: '84%', backgroundColor: '#FFF8E6', padding: 18, paddingTop: 50 },
  drawerRight: { width: '88%', backgroundColor: '#FFF8E6', padding: 18, paddingTop: 50 },
  drawerTitle: { fontWeight: '900', color: '#0A235A' }, editBtn: { backgroundColor: '#E8A317', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, marginTop: 10 },
  attachRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 13, borderRadius: 10, marginTop: 8 },
  logoutBtn: { backgroundColor: '#fff', padding: 13, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 13, borderRadius: 10, marginTop: 8, gap: 8 },
  setLabel: { fontWeight: '600', color: '#0A235A', flex: 1 },
  chip: { backgroundColor: '#F1F5F9', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16 }, chipActive: { backgroundColor: '#0A235A' },
  chipText: { fontWeight: '700', color: '#334155' }, chipTextActive: { color: '#fff' },
  toggle: { width: 46, height: 27, backgroundColor: '#CBD5E1', borderRadius: 14, justifyContent: 'center', padding: 3 }, toggleOn: { backgroundColor: '#8FA98F' },
  toggleDot: { width: 20, height: 20, backgroundColor: '#fff', borderRadius: 10 }, toggleDotOn: { alignSelf: 'flex-end' },
  centerWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }, popup: { backgroundColor: '#FFF8E6', borderRadius: 20, padding: 20, gap: 6 },
  qrBox: { height: 170, backgroundColor: '#0A235A', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  dimOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
});