import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ===== LINK LOGIC - SIRF YE NAYA HAI, BAAKI SAB SAME HAI =====
const API_URL = 'http://192.168.1.5:5000/api';
async function apiCall(endpoint: string, body: any, token?: string) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { data, isDemo: false };
  } catch (e) { return { data: null, isDemo: true }; }
}

const DUMMY = {
  user: { name: 'Aarav', email: 'aarav@test.com', phone: '+91 98765 43210', gender: 'Male', lastLogin: 'Today, 9:15 AM • Delhi' },
  balance: 2450, spent: 120, saved: 800, invested: 850, xp: 245, level: 3,
  monthlyBudget: { used: 620, total: 1000 },
  goal: { title: 'New headphones', saved: 3500, target: 5000 },
  rules: [
    { category: 'Food and snacks', status: 'Allowed', spent: 200, limit: 500 },
    { category: 'Games', status: 'Limit ₹500', spent: 450, limit: 500 },
    { category: 'Online shopping', status: 'Blocked', spent: 0, limit: null },
    { category: 'Books and courses', status: 'Allowed', spent: 150, limit: 1000 },
  ],
  lessons: [
    { id: 1, title: 'Budgeting basics', progress: 100 },
    { id: 2, title: 'Saving smart', progress: 60 },
    { id: 3, title: 'Needs vs wants', progress: 0 },
  ],
  badges: [
    { name: 'First Saver', earned: true, emoji: '🐷' },
    { name: 'Budget Boss', earned: true, emoji: '👑' },
    { name: 'Quiz Master', earned: false, emoji: '🧠' },
    { name: '7-Day Streak', earned: false, emoji: '🔥' },
    { name: 'Goal Getter', earned: false, emoji: '🎯' },
  ],
  mockInvest: { virtualBalance: 10000, profit: '+₹450' },
  transactions: [
    { id: 1, emoji: '🍔', name: 'Food Purchase', time: 'Today, 8:30 PM', amount: -120 },
    { id: 2, emoji: '📚', name: 'Lesson Completed', time: 'Today, 5:00 PM', amount: 20 },
    { id: 3, emoji: '🛒', name: 'Snacks - Spent', time: 'Yesterday', amount: -60 },
  ],
  spending: [
    { label: 'Food', pct: 40, color: '#3B82F6', emoji: '🔵', amount: 340 },
    { label: 'Shopping', pct: 35, color: '#34D399', emoji: '🟢', amount: 298 },
    { label: 'Travel', pct: 15, color: '#FBBF24', emoji: '🟡', amount: 128 },
    { label: 'Others', pct: 10, color: '#F97316', emoji: '🟠', amount: 84 },
  ],
  friends: [
    { id: 1, name: 'Ananya Sharma', xp: 320, level: 4, emoji: '👧' },
    { id: 2, name: 'Kabir Mehta', xp: 280, level: 3, emoji: '👦' },
    { id: 3, name: 'Diya Patel', xp: 245, level: 3, emoji: '👧' },
    { id: 4, name: 'Arjun Singh', xp: 210, level: 2, emoji: '👦' },
    { id: 5, name: 'Meera Iyer', xp: 180, level: 2, emoji: '👧' },
    { id: 6, name: 'Rohan Gupta', xp: 150, level: 1, emoji: '👦' },
  ],
};

function PillGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 4, flex: 1, marginLeft: 10 }}>
      {options.map((o) => {
        const active = value === o;
        return (
          <TouchableOpacity key={o} onPress={() => onChange(o)} style={[s.pill, { backgroundColor: active ? '#002E6E' : '#F3F4F6' }]}>
            <Text style={[s.pillText, { color: active ? '#fff' : '#6B7280' }]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TeenDashboard() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'Samarkan': require('../../assets/fonts/samarkan.ttf'),
  });
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(DUMMY);
  const [payMsg, setPayMsg] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  // ===== LINK WALA STATE - SIRF YE NAYA HAI =====
  const [familyCode, setFamilyCode] = useState('');
  const [linkedParent, setLinkedParent] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);

  // Profile Edit - Only in Profile, NOT in Settings
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('Male');

  // Settings - Parent Dashboard same
  const [notifOn, setNotifOn] = useState(true);
  const [notifVia, setNotifVia] = useState('App');
  const [vibration, setVibration] = useState(true);
  const [sound, setSound] = useState(true);
  const [lockType, setLockType] = useState('Fingerprint');
  const [fontSize, setFontSize] = useState('M');
  const [brightness, setBrightness] = useState(70);
  const [theme, setTheme] = useState('Dark');
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    (async () => {
      // Login wala naam uthao, DUMMY ko overwrite mat karo agar naam nahi mila to
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.name) setWallet((prev: any) => ({ ...prev, user: { ...prev.user, name: u.name, email: u.email || prev.user.email } }));
        } catch {}
      }
      // Pehle se linked hai kya? Check karo
      const savedCode = await AsyncStorage.getItem('familyCode');
      const savedParent = await AsyncStorage.getItem('linkedParent');
      if (savedCode && savedParent) { setFamilyCode(savedCode); setLinkedParent(savedParent); }
      setTimeout(() => setLoading(false), 500);
    })();
  }, []);

  // ===== LINK FUNCTIONS - SIRF YE NAYE HAIN =====
  const handleLinkParent = async () => {
    if (!familyCode.trim()) { Alert.alert('Enter Code', 'Enter the Family Code from your Parent'); return; }
    setLinkLoading(true);
    const token = await AsyncStorage.getItem('token');
    const result = await apiCall('/family/join', { familyCode: familyCode.trim().toUpperCase() }, token || undefined);
    setLinkLoading(false);
    if (!result.isDemo && result.data?.success === false) { Alert.alert('Wrong Code', result.data?.message || 'Ye code galat hai, Parent se dobara lo'); return; }
    // Demo ya Success - dono me link kar do
    const parentName = result.data?.parentName || 'Parent';
    await AsyncStorage.setItem('familyCode', familyCode.trim().toUpperCase());
    await AsyncStorage.setItem('linkedParent', parentName);
    setLinkedParent(parentName);
    Alert.alert('Linked! 🎉', result.isDemo ? `Demo Mode: Successfully Linked!\nCode: ${familyCode.trim().toUpperCase()}` : `Parent ${parentName} se link ho gaya!`);
  };

  const handleUnlink = async () => {
    Alert.alert('Unlink Parent?', 'Kya Parent se unlink karna hai?', [
      { text: 'Cancel' },
      { text: 'Unlink', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('familyCode');
        await AsyncStorage.removeItem('linkedParent');
        setLinkedParent(null); setFamilyCode('');
      }},
    ]);
  };

  const handlePay = (category: string, amount: number) => {
    if (category === 'Online shopping') {
      setPayMsg('Declined: Online shopping is blocked by parent');
    } else if (category === 'Games') {
      setPayMsg('Declined: Games limit of ₹500 exceeded');
    } else {
      setPayMsg('Approved! New Balance ₹' + (wallet.balance - amount));
    }
  };

  const handleScanPay = () => {
    setShowScanner(false);
    Alert.alert('PayPal Scan', 'QR scanned successfully.\n₹120 will be paid via PayPal.\nParent rules are being checked.');
    setPayMsg('PayPal Scan: ₹120 paid! (Demo)');
  };

  const openEdit = () => {
    setEditName(wallet.user.name);
    setEditEmail(wallet.user.email);
    setEditPhone(wallet.user.phone);
    setEditGender(wallet.user.gender);
    setIsEditing(true);
  };

  const saveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    if (!editEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    setWallet((prev: any) => ({
      ...prev,
      user: { ...prev.user, name: editName.trim(), email: editEmail.trim(), phone: editPhone.trim(), gender: editGender },
    }));
    setIsEditing(false);
    Alert.alert('Saved', 'Profile updated successfully!');
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#002E6E" />
        <Text style={{ marginTop: 10, fontWeight: '700' }}>Loading...</Text>
      </View>
    );
  }

  const goalPct = Math.round((wallet.goal.saved / wallet.goal.target) * 100);
  const budgetPct = Math.round((wallet.monthlyBudget.used / wallet.monthlyBudget.total) * 100);

  const getRuleStyle = (st: string) => {
    if (st === 'Allowed') return { backgroundColor: '#86EFAC', color: '#065F46' };
    if (st === 'Blocked') return { backgroundColor: '#E5E7EB', color: '#111827' };
    return { backgroundColor: '#FDBA74', color: '#7C2D12' };
  };

  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => setShowProfile(true)} style={s.profileBtn}>
          <Text style={{ fontSize: 28 }}>👤</Text>
        </TouchableOpacity>
        <View style={s.brandCenter}>
          <Text style={s.brandTitle}>Rupee Ranger</Text>
          <Text style={s.brandSub}>Teen Dashboard</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={s.settingsBtn}>
          <Text style={{ fontSize: 26 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 18 }}>
          <Text style={s.hiText}>Hi! {wallet.user.name}! 👋</Text>
          <Text style={s.subText}>Keep making smart moves!</Text>
        </View>

        {/* ===== PARENT LINK CARD - SIRF YE NAYA CARD HAI, BAAKI SAB SAME ===== */}
        <View style={s.whiteCard}>
          <Text style={s.cardTitle}>👨‍👩‍👧 Parent Link</Text>
          {linkedParent ? (
            <>
              <Text style={{ color: '#166534', fontWeight: '700', marginTop: 6 }}>✅ Linked with {linkedParent} • Code: {familyCode}</Text>
              <TouchableOpacity onPress={handleUnlink} style={{ marginTop: 10 }}><Text style={{ color: '#EF4444', fontWeight: '800' }}>Unlink Parent</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 13 }}>Enter the Family Code from your parent to link account </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TextInput value={familyCode} onChangeText={(t) => setFamilyCode(t.toUpperCase())} placeholder="FAM-1234" autoCapitalize="characters" style={[s.input, { flex: 1, marginTop: 0 }]} />
                <TouchableOpacity onPress={handleLinkParent} disabled={linkLoading} style={{ backgroundColor: '#002E6E', paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center' }}>
                  {linkLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '900' }}>Link</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Wallet Balance</Text>
          <Text style={s.balanceAmt}>₹{wallet.balance}</Text>
          <View style={s.balanceRow}>
            <View style={s.miniStat}><Text style={s.miniLabel}>Spent</Text><Text style={s.miniVal}>₹{wallet.spent}</Text></View>
            <View style={s.divider} />
            <View style={s.miniStat}><Text style={s.miniLabel}>Saved 🐷</Text><Text style={s.miniVal}>₹{wallet.saved}</Text></View>
            <View style={s.divider} />
            <View style={s.miniStat}><Text style={s.miniLabel}>Invested 📈</Text><Text style={s.miniVal}>₹{wallet.invested}</Text></View>
            <View style={s.divider} />
            <View style={s.miniStat}><Text style={s.miniLabel}>XP 🔥</Text><Text style={s.miniVal}>{wallet.xp} XP</Text></View>
          </View>
        </View>

        <View style={s.whiteCard}>
          <Text style={s.cardTitle}>Monthly Budget 📊</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontWeight: '700' }}>₹{wallet.monthlyBudget.used} / ₹{wallet.monthlyBudget.total}</Text>
            <Text style={{ fontWeight: '900' }}>{budgetPct}% used</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${budgetPct}%`, backgroundColor: budgetPct > 80 ? '#EF4444' : '#3B82F6' }]} />
          </View>
          <Text style={{ color: '#6B7280', marginTop: 6 }}>₹{wallet.monthlyBudget.total - wallet.monthlyBudget.used} remaining this month</Text>
        </View>

        <View style={s.whiteCard}>
          <Text style={s.cardTitle}>Savings Goal</Text>
          <Text style={s.cardSub}>{wallet.goal.title} 🎧</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontWeight: '700' }}>₹{wallet.goal.saved} / ₹{wallet.goal.target}</Text>
            <Text style={{ fontWeight: '900' }}>{goalPct}%</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${goalPct}%` }]} />
          </View>
        </View>

        <View style={s.rulesCard}>
          <Text style={s.rulesTitle}>Category Rules</Text>
          {wallet.rules.map((r: any, i: number) => {
            const pct = r.limit ? Math.round((r.spent / r.limit) * 100) : 0;
            const b = getRuleStyle(r.status);
            return (
              <View key={i} style={s.ruleBox}>
                <View style={s.ruleRow}>
                  <Text style={s.ruleName}>{r.category}</Text>
                  <View style={[s.ruleBadge, { backgroundColor: b.backgroundColor }]}>
                    <Text style={[s.ruleBadgeText, { color: b.color }]}>{r.status}</Text>
                  </View>
                </View>
                {r.limit ? (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={{ color: '#fff', fontSize: 13 }}>₹{r.spent} / ₹{r.limit} used</Text>
                      <Text style={{ color: pct >= 90 ? '#F87171' : '#86EFAC', fontSize: 13, fontWeight: '800' }}>
                        {pct}% {pct >= 90 ? 'Near limit!' : ''}
                      </Text>
                    </View>
                    <View style={s.ruleProgressBg}>
                      <View style={[s.ruleProgressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 90 ? '#EF4444' : '#34D399' }]} />
                    </View>
                  </>
                ) : (
                  <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 6 }}>{r.status === 'Blocked' ? 'This category is blocked' : '₹' + r.spent + ' spent'}</Text>
                )}
              </View>
            );
          })}
        </View>

        {payMsg !== '' ? (
          <Text style={{ marginHorizontal: 16, marginTop: 12, fontWeight: '800', color: payMsg.includes('Approved') || payMsg.includes('paid') ? 'green' : 'red' }}>{payMsg}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 12 }}>
          <TouchableOpacity onPress={() => handlePay('Online shopping', 500)} style={[s.demoBtn, { backgroundColor: '#EF4444' }]}>
            <Text style={s.demoBtnText}>Try Blocked Purchase</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePay('Games', 600)} style={[s.demoBtn, { backgroundColor: '#F59E0B' }]}>
            <Text style={s.demoBtnText}>Try Over Limit</Text>
          </TouchableOpacity>
        </View>

        <View style={s.whiteCard}>
          <Text style={s.cardTitle}>Spending Insights 📈</Text>
          <Text style={{ color: '#6B7280', marginTop: 4 }}>Total spent: ₹850 this week</Text>
          {wallet.spending.map((item: any, i: number) => (
            <View key={i} style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700' }}>{item.emoji} {item.label}</Text>
                <Text style={{ fontWeight: '800' }}>₹{item.amount} • {item.pct}%</Text>
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
        </View>

        <View style={s.whiteCard}>
          <Text style={s.cardTitle}>Learn & Earn 📚</Text>
          {wallet.lessons.map((l: any) => (
            <View key={l.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <Text style={{ fontWeight: '700' }}>{l.id}. {l.title}</Text>
              <Text style={{ fontWeight: '800', color: l.progress === 100 ? 'green' : '#6B7280' }}>{l.progress === 100 ? 'Done' : l.progress + '%'}</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => router.push('/lessons')}>
            <Text style={{ color: '#002E6E', fontWeight: '800', marginTop: 10 }}>View All Lessons →</Text>
          </TouchableOpacity>
        </View>

        <View style={s.whiteCard}>
          <Text style={s.cardTitle}>Badges & Rewards 🏆</Text>
          <Text style={{ color: '#6B7280', marginTop: 4 }}>Level {wallet.level} • {wallet.xp} XP</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {wallet.badges.map((b: any, i: number) => (
              <View key={i} style={{ alignItems: 'center', flex: 1, opacity: b.earned ? 1 : 0.35 }}>
                <Text style={{ fontSize: 30 }}>{b.emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 4 }}>{b.name}</Text>
                <Text style={{ fontSize: 10 }}>{b.earned ? 'Earned' : 'Locked'}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.whiteCard}>
          <Text style={s.cardTitle}>Mock Investing 📈</Text>
          <Text style={{ marginTop: 6, fontWeight: '700' }}>Virtual Balance: ₹{wallet.mockInvest.virtualBalance} • Profit: {wallet.mockInvest.profit}</Text>
          <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>No real money at risk • Parent can turn ON / OFF</Text>
          <TouchableOpacity onPress={() => router.push('/investment')} style={{ backgroundColor: '#002E6E', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: '#fff', fontWeight: '900' }}>Try Mock Investing →</Text>
          </TouchableOpacity>
        </View>

        <View style={s.transCard}>
          <Text style={s.sectionTitle2}>Recent Activity</Text>
          {wallet.transactions.map((tx: any) => (
            <View key={tx.id} style={s.transRow}>
              <Text style={{ fontSize: 26 }}>{tx.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.transName}>{tx.name}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{tx.time}</Text>
              </View>
              <Text style={tx.amount > 0 ? s.transAmtGreen : s.transAmtRed}>{tx.amount > 0 ? '+₹' + tx.amount : '-₹' + Math.abs(tx.amount)}</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => router.push('/transaction')}>
            <Text style={{ color: '#002E6E', fontWeight: '800', marginTop: 8 }}>View All History →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={s.navWrap}>
        <View style={s.nav}>
          <TouchableOpacity style={s.navItem} onPress={() => router.push('/teen-dashboard')}>
            <Text style={s.navEmoji}>🏠</Text><Text style={[s.navText, { color: '#002E6E' }]}>HOME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navItem} onPress={() => router.push('/league')}>
            <Text style={s.navEmoji}>🏆</Text><Text style={s.navText}>LEAGUE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navItem} onPress={() => router.push('/piggy_bank')}>
            <Text style={s.navEmoji}>🐷</Text><Text style={s.navText}>PIGGY BANK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.scannerBtn} onPress={() => setShowScanner(true)}>
            <View style={s.qrIcon}>
              <View style={[s.qrBox, { top: 0, left: 0 }]} />
              <View style={[s.qrBox, { top: 0, right: 0 }]} />
              <View style={[s.qrBox, { bottom: 0, left: 0 }]} />
              <View style={[s.qrDot, { top: 3, right: 3 }]} />
              <View style={[s.qrDot, { bottom: 3, left: 8 }]} />
              <View style={[s.qrDot, { bottom: 3, right: 3 }]} />
              <View style={[s.qrDot, { bottom: 8, right: 8 }]} />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '900', marginTop: 2 }}>SCAN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navItem} onPress={() => router.push('/lessons')}>
            <Text style={s.navEmoji}>📚</Text><Text style={s.navText}>LESSONS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navItem} onPress={() => router.push('/investment')}>
            <Text style={s.navEmoji}>📈</Text><Text style={s.navText}>INVEST</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navItem} onPress={() => router.push('/transaction')}>
            <Text style={s.navEmoji}>🧾</Text><Text style={s.navText}>HISTORY</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showScanner} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#002E6E' }}>Scan & Pay - PayPal</Text>
              <Pressable onPress={() => setShowScanner(false)}><Text style={{ fontSize: 22, fontWeight: '900' }}>✕</Text></Pressable>
            </View>
            <Text style={{ color: '#6B7280', marginTop: 6 }}>Place the QR code inside the frame</Text>
            <View style={{ backgroundColor: '#F5F7FA', borderRadius: 20, height: 220, marginTop: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#002E6E', borderStyle: 'dashed' }}>
              <View style={s.qrIconBig}>
                <View style={[s.qrBoxBig, { top: 0, left: 0 }]} />
                <View style={[s.qrBoxBig, { top: 0, right: 0 }]} />
                <View style={[s.qrBoxBig, { bottom: 0, left: 0 }]} />
                <View style={[s.qrDotBig, { top: 8, right: 8 }]} />
                <View style={[s.qrDotBig, { bottom: 8, left: 20 }]} />
                <View style={[s.qrDotBig, { bottom: 8, right: 8 }]} />
              </View>
              <Text style={{ marginTop: 12, fontWeight: '700', color: '#6B7280' }}>PayPal QR Scanner (Demo)</Text>
            </View>
            <Text style={{ marginTop: 12, fontWeight: '600' }}>Parent rules will be checked first</Text>
            <Text style={{ marginTop: 4, fontWeight: '600' }}>Secure payment via PayPal</Text>
            <TouchableOpacity onPress={handleScanPay} style={{ backgroundColor: '#002E6E', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Pay ₹120 via PayPal →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowScanner(false)} style={{ padding: 14, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontWeight: '800', color: '#6B7280' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PROFILE - FULL PAGE, Edit sirf yahi hoga */}
      <Modal visible={showProfile} animationType="slide">
        <View style={s.profileFullPage}>
          <View style={s.profileHeader}>
            <Pressable onPress={() => { setShowProfile(false); setIsEditing(false); }}><Text style={s.backBtn}>← Back</Text></Pressable>
            <Text style={s.profilePageTitle}>Profile</Text>
            <Pressable onPress={openEdit}><Text style={{ color: '#002E6E', fontWeight: '900', fontSize: 16 }}>Edit</Text></Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <View style={s.avatarCircle}><Text style={{ fontSize: 78 }}>😎</Text></View>
              <Text style={s.profileName}>{wallet.user.name}</Text>
              <Text style={{ color: '#6B7280', fontWeight: '600' }}>Level {wallet.level} • {wallet.xp} XP</Text>
            </View>

            {!isEditing ? (
              <>
                <View style={s.profileCard}>
                  <Text style={s.profileLabel}>Email</Text><Text style={s.profileValue}>{wallet.user.email}</Text>
                  <Text style={[s.profileLabel, { marginTop: 14 }]}>Phone No</Text><Text style={s.profileValue}>{wallet.user.phone}</Text>
                  <Text style={[s.profileLabel, { marginTop: 14 }]}>Gender</Text><Text style={s.profileValue}>{wallet.user.gender}</Text>
                </View>

                <Pressable style={s.friendsRow} onPress={() => setShowFriends(true)}>
                  <View>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: '#002E6E' }}>👥 Friends</Text>
                    <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>{wallet.friends.length} friends • Tap to view list</Text>
                  </View>
                  <Text style={{ fontSize: 28, color: '#002E6E', fontWeight: '900' }}>›</Text>
                </Pressable>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  {wallet.friends.slice(0, 5).map((f: any) => (
                    <View key={f.id} style={{ alignItems: 'center', flex: 1 }}>
                      <View style={s.friendAvatar}><Text style={{ fontSize: 22 }}>{f.emoji}</Text></View>
                      <Text style={{ fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 }}>{f.name.split(' ')[0]}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.profileCard}>
                  <Text style={s.profileLabel}>Last Login</Text>
                  <Text style={s.profileValue}>{wallet.user.lastLogin}</Text>
                </View>

                <TouchableOpacity style={[s.logoutBtn, { marginTop: 18 }]} onPress={() => Alert.alert('Logout', 'Logout from this device?', [{ text: 'Cancel' }, { text: 'Logout', onPress: async () => { await AsyncStorage.removeItem('token'); setShowProfile(false); router.push('/'); } }])}>
                  <Text style={{ color: '#002E6E', fontWeight: '900', fontSize: 16 }}>Logout From This Device</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.logoutBtn, { backgroundColor: '#FFE5E5', marginTop: 10 }]} onPress={() => Alert.alert('Logout From All Devices', 'You will be logged out from all devices. Continue?', [{ text: 'Cancel' }, { text: 'Logout All', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem('token'); setShowProfile(false); router.push('/'); } }])}>
                  <Text style={{ color: 'red', fontWeight: '900', fontSize: 16 }}>Logout From All Devices</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
              </>
            ) : (
              <View style={s.profileCard}>
                <Text style={s.profileLabel}>Full Name</Text>
                <TextInput style={s.input} value={editName} onChangeText={setEditName} placeholder="Enter your name" autoFocus />
                <Text style={s.profileLabel}>Email</Text>
                <TextInput style={s.input} value={editEmail} onChangeText={setEditEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
                <Text style={s.profileLabel}>Phone No</Text>
                <TextInput style={s.input} value={editPhone} onChangeText={setEditPhone} placeholder="+91 ..." keyboardType="phone-pad" />
                <Text style={s.profileLabel}>Gender</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity key={g} onPress={() => setEditGender(g)} style={[s.genderBtn, { backgroundColor: editGender === g ? '#002E6E' : '#F3F4F6' }]}>
                      <Text style={{ fontWeight: '800', color: editGender === g ? '#fff' : '#333' }}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={saveProfile} style={[s.editBtn, { marginTop: 18 }]}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditing(false)} style={{ padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '800', color: '#6B7280' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* FRIENDS LIST */}
      <Modal visible={showFriends} animationType="slide">
        <View style={s.profileFullPage}>
          <View style={s.profileHeader}>
            <Pressable onPress={() => setShowFriends(false)}><Text style={s.backBtn}>← Back</Text></Pressable>
            <Text style={s.profilePageTitle}>Friends</Text>
            <Text style={{ width: 40 }} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ color: '#6B7280', fontWeight: '600', marginTop: 12 }}>These friends will be compared with you in League</Text>
            {wallet.friends.map((f: any) => (
              <View key={f.id} style={s.friendRow}>
                <Text style={{ fontSize: 28 }}>{f.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', fontSize: 16 }}>{f.name}</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>Level {f.level} • {f.xp} XP</Text>
                </View>
                <View style={[s.rankBadge, { backgroundColor: f.xp > wallet.xp ? '#FEE2E2' : '#DCFCE7' }]}>
                  <Text style={{ fontWeight: '900', fontSize: 12, color: f.xp > wallet.xp ? '#DC2626' : '#166534' }}>{f.xp > wallet.xp ? 'Ahead' : 'Behind'}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={s.editBtn} onPress={() => { setShowFriends(false); router.push('/league'); }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Compare in League →</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* SETTINGS - Parent wali, Edit hata diya */}
      <Modal visible={showSettings} animationType="slide">
        <ScrollView style={s.settingsContainer} showsVerticalScrollIndicator={false}>
          <View style={s.settingsHeader}>
            <Text style={s.settingsTitle}>SETTINGS</Text>
            <Pressable onPress={() => setShowSettings(false)}><Text style={{ fontSize: 22 }}>✕</Text></Pressable>
          </View>

          <Text style={s.setSection}>Account</Text>
          <View style={s.setRow}>
            <Text style={s.setLabel}>Change Email / Mobile No</Text>
            <TouchableOpacity style={s.setBtn} onPress={() => { setShowSettings(false); setShowProfile(true); openEdit(); }}><Text style={s.setBtnText}>Edit</Text></TouchableOpacity>
          </View>
          <View style={s.setRow}>
            <Text style={s.setLabel}>Change Password</Text>
            <TouchableOpacity style={s.setBtn} onPress={() => Alert.alert('Change Password', 'Password can be changed with parent permission.')}><Text style={s.setBtnText}>Change</Text></TouchableOpacity>
          </View>

          <Text style={s.setSection}>Notifications</Text>
          <View style={s.setRow}><Text style={s.setLabel}>Notifications</Text><Switch value={notifOn} onValueChange={setNotifOn} trackColor={{ false: '#D1D5DB', true: '#002E6E' }} /></View>
          <View style={s.setRow}><Text style={s.setLabel}>Via</Text><PillGroup options={['Email', 'App', 'SMS']} value={notifVia} onChange={setNotifVia} /></View>
          <View style={s.setRow}><Text style={s.setLabel}>Vibration</Text><Switch value={vibration} onValueChange={setVibration} trackColor={{ false: '#D1D5DB', true: '#002E6E' }} /></View>
          <View style={s.setRow}><Text style={s.setLabel}>Sound</Text><Switch value={sound} onValueChange={setSound} trackColor={{ false: '#D1D5DB', true: '#002E6E' }} /></View>

          <Text style={s.setSection}>App Lock</Text>
          <View style={s.setRow}><Text style={s.setLabel}>Lock Type</Text><PillGroup options={['None', 'Pattern', 'Numeric', 'Fingerprint', 'Face Scan']} value={lockType} onChange={setLockType} /></View>

          <Text style={s.setSection}>App Appearance</Text>
          <View style={s.setRow}><Text style={s.setLabel}>Font Size</Text><PillGroup options={['XS', 'S', 'M', 'L', 'XL', 'XXL']} value={fontSize} onChange={setFontSize} /></View>
          <View style={s.setRow}>
            <Text style={s.setLabel}>Brightness {brightness}%</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity style={s.smallBtn} onPress={() => setBrightness(Math.max(10, brightness - 10))}><Text style={s.smallBtnText}>-</Text></TouchableOpacity>
              <Text style={{ fontWeight: '800', width: 38, textAlign: 'center' }}>{brightness}%</Text>
              <TouchableOpacity style={s.smallBtn} onPress={() => setBrightness(Math.min(100, brightness + 10))}><Text style={s.smallBtnText}>+</Text></TouchableOpacity>
            </View>
          </View>
          <View style={s.setRow}><Text style={s.setLabel}>Theme</Text><PillGroup options={['Light', 'Dark']} value={theme} onChange={setTheme} /></View>

          <Text style={s.setSection}>Language</Text>
          <View style={s.setRow}><Text style={s.setLabel}>Language</Text><PillGroup options={['English', 'Hindi', 'French', 'Spanish', 'Tamil']} value={language} onChange={setLanguage} /></View>

          <Text style={s.setSection}>Support</Text>
          <View style={s.setRow}><Text style={s.setLabel}>Help & FAQ</Text><TouchableOpacity style={s.setBtn} onPress={() => Alert.alert('Help & FAQ', 'Mail us at help@rupeeranger.app')}><Text style={s.setBtnText}>Open</Text></TouchableOpacity></View>
          <View style={s.setRow}><Text style={s.setLabel}>Contact Us / Report Problem</Text><TouchableOpacity style={s.setBtn} onPress={() => Alert.alert('Contact Us', 'Mail us at help@rupeeranger.app')}><Text style={s.setBtnText}>Contact</Text></TouchableOpacity></View>

          <TouchableOpacity style={s.deleteBtn} onPress={() => Alert.alert('Delete Account', 'Are you sure? This will delete your account permanently.', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive' }])}>
            <Text style={{ color: 'red', fontWeight: '800', textAlign: 'center' }}>Delete Account</Text>
          </TouchableOpacity>

          <Pressable style={[s.settingsItem, { backgroundColor: '#FFE5E5', marginTop: 16, marginBottom: 30 }]} onPress={() => { setShowSettings(false); router.push('/parent-dashboard'); }}>
            <Text style={[s.settingsText, { color: '#002E6E' }]}>👨‍👩‍👧 Parent Dashboard</Text><Text style={{ fontSize: 22 }}>›</Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 50, paddingBottom: 8, gap: 8 },
  profileBtn: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#002E6E' },
  settingsBtn: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E5E7EB' },
  brandCenter: { flex: 1, alignItems: 'center' },
  brandTitle: { fontSize: 38, color: '#002E6E', textAlign: 'center', fontFamily: 'Samarkan' },
  brandSub: { fontSize: 16, fontWeight: '700', color: '#FFD93D' },
  hiText: { color: '#002E6E', fontSize: 28, fontWeight: '900' },
  subText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
  balanceCard: { backgroundColor: '#002E6E', marginHorizontal: 16, marginTop: 14, borderRadius: 26, padding: 22, borderWidth: 2, borderColor: '#FFD93D' },
  balanceLabel: { color: '#FFD93D', fontSize: 14, fontWeight: '800' },
  balanceAmt: { color: '#fff', fontSize: 44, fontWeight: '900', marginTop: 6 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, backgroundColor: '#1E4FFF', borderRadius: 16, padding: 16 },
  miniStat: { flex: 1, alignItems: 'center' },
  miniLabel: { color: '#DCE8FF', fontSize: 12, fontWeight: '700' },
  miniVal: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 3 },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 4 },
  whiteCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 18 },
  cardTitle: { fontSize: 19, fontWeight: '900', color: '#002E6E' },
  cardSub: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 4 },
  progressBg: { height: 12, backgroundColor: '#E5E7EB', borderRadius: 6, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 12, backgroundColor: '#3B82F6', borderRadius: 6 },
  rulesCard: { backgroundColor: '#0A2540', marginHorizontal: 16, marginTop: 16, borderRadius: 22, padding: 20 },
  rulesTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  ruleBox: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, marginTop: 10 },
  ruleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ruleName: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  ruleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  ruleBadgeText: { fontSize: 13, fontWeight: '800' },
  ruleProgressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  ruleProgressFill: { height: 8, borderRadius: 4 },
  demoBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  demoBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  transCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, borderRadius: 20, padding: 18 },
  sectionTitle2: { fontWeight: '900', color: '#002E6E', fontSize: 18 },
  transRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  transName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  transAmtGreen: { color: '#22C55E', fontWeight: '900', fontSize: 16 },
  transAmtRed: { color: '#EF4444', fontWeight: '900', fontSize: 16 },
  navWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 8, paddingBottom: 10 },
  nav: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 26, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'space-around', elevation: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  navItem: { alignItems: 'center', flex: 1 },
  navEmoji: { fontSize: 24 },
  navText: { fontSize: 10, fontWeight: '800', color: '#6B7280', marginTop: 3, textAlign: 'center' },
  scannerBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFD93D', alignItems: 'center', justifyContent: 'center', marginTop: -42, borderWidth: 3, borderColor: '#fff', elevation: 8 },
  qrIcon: { width: 28, height: 28, position: 'relative' },
  qrBox: { width: 11, height: 11, borderWidth: 3, borderColor: '#002E6E', position: 'absolute', borderRadius: 2 },
  qrDot: { width: 5, height: 5, backgroundColor: '#002E6E', position: 'absolute', borderRadius: 1 },
  qrIconBig: { width: 110, height: 110, position: 'relative' },
  qrBoxBig: { width: 38, height: 38, borderWidth: 6, borderColor: '#002E6E', position: 'absolute', borderRadius: 4 },
  qrDotBig: { width: 14, height: 14, backgroundColor: '#002E6E', position: 'absolute', borderRadius: 2 },
  modalContainer: { flex: 1, padding: 22, paddingTop: 60, backgroundColor: '#F5F7FA' },
  backBtn: { fontSize: 22, color: '#002E6E', fontWeight: '900' },
  modalHeading: { fontSize: 32, fontWeight: '900', color: '#002E6E', marginTop: 22, marginBottom: 8 },
  sectionHead: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', marginTop: 22, marginBottom: 2, letterSpacing: 1 },
  avatarCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#fff', borderWidth: 2.5, borderColor: '#002E6E', alignItems: 'center', justifyContent: 'center' },
  profileName: { color: '#002E6E', fontSize: 30, fontWeight: '900', marginTop: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginTop: 18 },
  profileLabel: { fontSize: 13, fontWeight: '800', color: '#6B7280', marginTop: 8 },
  profileValue: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 2 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, marginTop: 6, fontSize: 16, fontWeight: '600', borderWidth: 1, borderColor: '#E5E7EB' },
  genderBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  editBtn: { backgroundColor: '#002E6E', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 18 },
  settingsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 16, marginTop: 10 },
  settingsText: { fontSize: 17, fontWeight: '700', color: '#002E6E' },
  settingsContainer: { flex: 1, backgroundColor: '#FFFBF0', padding: 20, paddingTop: 50 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingsTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  setSection: { fontSize: 14, fontWeight: '800', color: '#111827', marginTop: 24, marginBottom: 6 },
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDE9E0', gap: 8 },
  setLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  setBtn: { backgroundColor: '#002E6E', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  setBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  pillText: { fontSize: 11, fontWeight: '700' },
  smallBtn: { backgroundColor: '#002E6E', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  smallBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  deleteBtn: { backgroundColor: '#FFE9E9', padding: 14, borderRadius: 12, marginTop: 22 },
  profileFullPage: { flex: 1, backgroundColor: '#F5F7FA', padding: 22, paddingTop: 60 },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  profilePageTitle: { fontSize: 24, fontWeight: '900', color: '#002E6E' },
  friendsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 18, marginTop: 18 },
  friendAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 16, marginTop: 10 },
  rankBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  logoutBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
});