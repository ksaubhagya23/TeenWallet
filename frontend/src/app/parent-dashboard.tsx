import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// FONTS - Rupee Ranger -> Samarkan, All Others -> Rubik
const FONT_LOGO = 'Samarkan';
const FONT_BODY = 'Rubik';

// NEW COLOR COMBO - Inspired by Madhubani Art
// Deep Navy #0A235A + Warm Cream #FFF8E6 + Terracotta #C96F4A + Mustard #E8A317 + Soft Sage #8FA98F
const COLORS = {
  navy: '#0A235A',
  cream: '#FFF8E6',
  terracotta: '#C96F4A',
  mustard: '#E8A317',
  sage: '#8FA98F',
  card: '#FFF8E6',
};

type Child = {
  id: string; name: string; username: string; email: string; age: number; cls: string; online: boolean;
  balance: number; allowance: number; spent: number; chats: number;
  learning: { topic: string; done: number; total: number; progress: number; badge: string };
  limits: { daily: number; perTransaction: number; food: number; games: number };
  categories: { label: string; amt: number; color: string }[];
  history: { label: string; amt: string; time: string }[];
};

const INITIAL_CHILDREN: Child[] = [
  { id: '1', name: 'Aarav', username: 'aarav_13', email: 'aarav@gmail.com', age: 13, cls: 'Class 8', online: true, balance: 850, allowance: 100, spent: 320, chats: 12,
    learning: { topic: 'Money Basics', done: 6, total: 8, progress: 75, badge: 'Saving Star ⭐' },
    limits: { daily: 100, perTransaction: 60, food: 150, games: 120 },
    categories: [{ label: 'Food', amt: 140, color: '#E8A317' }, { label: 'Games', amt: 110, color: '#0A235A' }, { label: 'Books', amt: 70, color: '#8FA98F' }],
    history: [{ label: 'Allowance - Weekly', amt: '+ Rs.100', time: 'Sun, 9:00 AM' }, { label: 'Food - Cafe Market', amt: '- Rs.60', time: 'Sat, 1:20 PM' }] },
  { id: '2', name: 'Shanaya', username: 'shanaya_11', email: 'shanaya@gmail.com', age: 11, cls: 'Class 6', online: false, balance: 420, allowance: 80, spent: 180, chats: 8,
    learning: { topic: 'Budgeting Basics', done: 3, total: 8, progress: 38, badge: 'Beginner' },
    limits: { daily: 50, perTransaction: 40, food: 100, games: 50 },
    categories: [{ label: 'Food', amt: 90, color: '#E8A317' }, { label: 'Shopping', amt: 60, color: '#C96F4A' }, { label: 'Books', amt: 30, color: '#8FA98F' }],
    history: [{ label: 'Allowance - Weekly', amt: '+ Rs.80', time: 'Sun, 9:00 AM' }, { label: 'Shopping', amt: '- Rs.60', time: 'Sat, 4:10 PM' }] },
  { id: '3', name: 'Preeti', username: 'preeti_15', email: 'preeti@gmail.com', age: 15, cls: 'Class 10', online: true, balance: 1250, allowance: 150, spent: 450, chats: 18,
    learning: { topic: 'Smart Spending', done: 9, total: 10, progress: 90, badge: 'Money Master 🏆' },
    limits: { daily: 150, perTransaction: 100, food: 200, games: 100 },
    categories: [{ label: 'Food', amt: 180, color: '#E8A317' }, { label: 'Transport', amt: 150, color: '#60A5FA' }, { label: 'Books', amt: 120, color: '#8FA98F' }],
    history: [{ label: 'Allowance - Weekly', amt: '+ Rs.150', time: 'Sun, 9:00 AM' }, { label: 'Transport', amt: '- Rs.50', time: 'Mon, 8:00 AM' }] },
];

const FONT_SCALE: any = { XS: 0.8, S: 0.9, M: 1, L: 1.15, XL: 1.3, XXL: 1.45 };

export default function ParentDashboard() {
  const [CHILDREN, setCHILDREN] = useState(INITIAL_CHILDREN);
  const [selectedId, setSelectedId] = useState('1');
  const [tab, setTab] = useState<'home' | 'allowance' | 'overview' | 'history'>('home');
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [sendAmt, setSendAmt] = useState('');
  const [allowanceFreq, setAllowanceFreq] = useState<'Per Day' | 'Per Week' | 'Per Month'>('Per Week');

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [parentName, setParentName] = useState('Parent Name');
  const [parentEmail, setParentEmail] = useState('parent@gmail.com');
  const [parentMobile, setParentMobile] = useState('+91 98765 43210');
  const [oldPass, setOldPass] = useState(''); const [newPass, setNewPass] = useState('');

  // OTP STATES - For Email / Phone Change
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempMobile, setTempMobile] = useState('');

  // ADD CHILD STATES
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildUsername, setNewChildUsername] = useState('');
  const [newChildEmail, setNewChildEmail] = useState('');
  const [newChildCls, setNewChildCls] = useState('');
  const [newChildAge, setNewChildAge] = useState('');

  // EDIT LIMITS STATES - For Category Limits
  const [showEditLimits, setShowEditLimits] = useState(false);
  const [editingChildId, setEditingChildId] = useState('');
  const [editDaily, setEditDaily] = useState('');
  const [editPerTransaction, setEditPerTransaction] = useState('');
  const [editFood, setEditFood] = useState('');
  const [editGames, setEditGames] = useState('');

  const [notifOn, setNotifOn] = useState(true);
  const [notifVia, setNotifVia] = useState('App');
  const [vibration, setVibration] = useState(true);
  const [sound, setSound] = useState(true);
  const [appLock, setAppLock] = useState('Fingerprint');
  const [fontSize, setFontSize] = useState('M');
  const [brightness, setBrightness] = useState(70);
  const [theme, setTheme] = useState('Dark');
  const [lang, setLang] = useState('English');

  // FAMILY LINK - Demo Mode, Backend Will Be Connected Later
  const [familyCode, setFamilyCode] = useState('');
  const [linkedTeenCode, setLinkedTeenCode] = useState('');
  const [isTeenLinked, setIsTeenLinked] = useState(false);

  // GENERATE UNIQUE FAMILY CODE - One Code Per Parent
  const generateFamilyCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'FAM-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  useEffect(() => {
    const loadOrCreateCode = async () => {
      try {
        let savedParentCode = await AsyncStorage.getItem('parentFamilyCode');
        if (!savedParentCode) {
          savedParentCode = generateFamilyCode();
          await AsyncStorage.setItem('parentFamilyCode', savedParentCode);
        }
        setFamilyCode(savedParentCode);
        const savedCode = await AsyncStorage.getItem('familyCode');
        const linked = await AsyncStorage.getItem('linkedParent');
        if (savedCode === savedParentCode && linked === 'true') {
          setLinkedTeenCode(savedCode);
          setIsTeenLinked(true);
        }
      } catch (e) {
        if (!familyCode) setFamilyCode(generateFamilyCode());
      }
    };
    loadOrCreateCode();
  }, []);

  const child = CHILDREN.find(c => c.id === selectedId)!;
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
    return (
      <View>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 10 }}>
          {cats.map((c: any, i: number) => (
            <View key={i} style={{ flex: c.amt, height: 26, backgroundColor: c.color, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }}>
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

  const handleAddChild = () => {
    if (!newChildName || !newChildUsername || !newChildEmail) { alert('Please fill Name, Username and Email / Phone'); return; }
    const newChild: Child = {
      id: String(Date.now()), name: newChildName, username: newChildUsername, email: newChildEmail,
      age: Number(newChildAge) || 10, cls: newChildCls || 'Class 5', online: false,
      balance: 0, allowance: 100, spent: 0, chats: 0,
      learning: { topic: 'Money Basics', done: 0, total: 8, progress: 0, badge: 'New Learner 🌱' },
      limits: { daily: 100, perTransaction: 50, food: 100, games: 50 },
      categories: [{ label: 'Food', amt: 0, color: '#E8A317' }, { label: 'Games', amt: 0, color: '#0A235A' }, { label: 'Books', amt: 0, color: '#8FA98F' }],
      history: [{ label: 'Account Created', amt: '+ Rs.0', time: 'Today' }],
    };
    setCHILDREN([...CHILDREN, newChild]);
    setSelectedId(newChild.id); setTab('home');
    setNewChildName(''); setNewChildUsername(''); setNewChildEmail(''); setNewChildCls(''); setNewChildAge('');
    setShowAddChild(false);
    alert(`${newChildName} added successfully!`);
  };

  // OPEN EDIT LIMITS - Fill Current Values
  const openEditLimits = (c: Child) => {
    setEditingChildId(c.id);
    setEditDaily(String(c.limits.daily));
    setEditPerTransaction(String(c.limits.perTransaction));
    setEditFood(String(c.limits.food));
    setEditGames(String(c.limits.games));
    setShowEditLimits(true);
  };

  // SAVE LIMITS - Update Child Limits And Save
  const saveLimits = () => {
    const updated = CHILDREN.map(c => {
      if (c.id === editingChildId) {
        return {
          ...c,
          limits: {
            daily: Number(editDaily) || 0,
            perTransaction: Number(editPerTransaction) || 0,
            food: Number(editFood) || 0,
            games: Number(editGames) || 0,
          }
        };
      }
      return c;
    });
    setCHILDREN(updated);
    setShowEditLimits(false);
    alert('Limits updated successfully! Teen cannot spend more than these limits.');
  };

  // CHECK LIMIT - Returns True If Spending Exceeds Limit
  const isOverLimit = (spent: number, limit: number) => spent >= limit;

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
              <View style={[styles.dot, { backgroundColor: c.online ? '#8FA98F' : '#C96F4A' }]} />
            </View>
            <Text style={[styles.childName, T(12), selectedId === c.id && styles.childNameActive]}>{c.name}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setShowAddChild(true)} style={{ alignItems: 'center' }}><View style={[styles.avatar, { borderStyle: 'dashed' }]}><Text style={[styles.avatarTxt, T(24)]}>+</Text></View><Text style={[styles.childName, T(12)]}>Add</Text></Pressable>
      </ScrollView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {tab === 'home' && (
          <View style={{ padding: 16, gap: 14 }}>
            {/* FAMILY CODE CARD - Same Style As Other Cards */}
            <View style={styles.card}>
              <Text style={[styles.cardTitle, T(16)]}>👨‍👩‍👧 Family Code</Text>
              <Text style={[styles.muted, T(14), { marginTop: 6 }]}>Share this code with your teen to link account</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' }}>
                <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                  <Text style={[styles.bold, T(18), { textAlign: 'center', letterSpacing: 2 }]}>{familyCode || 'Generating...'}</Text>
                </View>
                <TouchableOpacity style={styles.sendBtn} onPress={() => alert(`Family Code: ${familyCode} - Share with your teen`)}><Text style={[T(14), { color: '#0A235A', fontWeight: '800' }]}>Share</Text></TouchableOpacity>
              </View>
              <Text style={[styles.muted, T(13), { marginTop: 10 }]}>{isTeenLinked ? `Linked: Teen connected with code ${linkedTeenCode}` : 'Waiting: Teen has not linked yet'}</Text>
            </View>
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View><Text style={[styles.bigName, T(21)]}>{child.name}</Text><Text style={[styles.muted, T(14)]}>{child.age} yrs • {child.cls} • @{child.username}</Text><Text style={[styles.muted, T(13)]}>{child.email}</Text></View>
                <Text style={[T(13), { fontWeight: '700', color: child.online ? '#16A34A' : '#C96F4A' }]}>{child.online ? '● Online' : '● Offline'}</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}><Text style={[styles.statLabel, T(12)]}>Balance</Text><Text style={[styles.statVal, T(18)]}>Rs.{child.balance}</Text></View>
                <View style={styles.stat}><Text style={[styles.statLabel, T(12)]}>Spent</Text><Text style={[styles.statVal, T(18)]}>Rs.{child.spent}</Text></View>
                <View style={styles.stat}><Text style={[styles.statLabel, T(12)]}>Chats</Text><Text style={[styles.statVal, T(18)]}>{child.chats}</Text></View>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={[styles.cardTitle, T(16)]}>Categories</Text>
              {child.categories.map((c, i) => (
                <View key={i} style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.muted, T(14)]}>{c.label}</Text><Text style={[styles.bold, T(14)]}>Rs.{c.amt}</Text></View>
                  <View style={styles.barBg}><View style={[styles.barFill, { width: `${child.spent ? (c.amt / child.spent) * 100 : 0}%`, backgroundColor: c.color }]} /></View>
                </View>
              ))}
              <Text style={[styles.cardTitle, T(16), { marginTop: 16 }]}>Spending - Pie Chart</Text>
              {Pie(child.categories)}
            </View>
          </View>
        )}

        {tab === 'allowance' && (
          <View style={{ padding: 16, gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {['Per Day', 'Per Week', 'Per Month'].map(f => (
                <Pressable key={f} onPress={() => setAllowanceFreq(f as any)} style={[styles.chip, { paddingHorizontal: 16, paddingVertical: 10 }, allowanceFreq === f && styles.chipActive]}>
                  <Text style={[styles.chipText, T(14), allowanceFreq === f && styles.chipTextActive]}>{f}</Text>
                </Pressable>
              ))}
            </View>
            {CHILDREN.map(c => {
              const foodSpent = c.categories.find(x => x.label === 'Food')?.amt || 0;
              const gamesSpent = c.categories.find(x => x.label === 'Games')?.amt || 0;
              const foodPct = Math.min(100, (foodSpent / c.limits.food) * 100);
              const dailyPct = Math.min(100, (c.spent / 7 / c.limits.daily) * 100);
              const foodBlocked = isOverLimit(foodSpent, c.limits.food);
              const gamesBlocked = isOverLimit(gamesSpent, c.limits.games);
              return (
                <View key={c.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.bigName, T(20)]}>{c.name}</Text><Text style={[styles.bold, T(16)]}>Rs.{c.balance}</Text></View>
                  <Text style={[styles.muted, T(14)]}>@{c.username} • Allowance: Rs.{c.allowance} {allowanceFreq === 'Per Day' ? '/ day • Every Day' : allowanceFreq === 'Per Week' ? '/ week • Every Sunday' : '/ month • 1st of Month'}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TextInput style={[styles.input, { flex: 1, fontFamily: FONT_BODY, fontSize: 15 * fs }]} placeholder="Amount Rs." keyboardType="numeric" value={selectedId === c.id ? sendAmt : ''} onChangeText={(t) => { setSelectedId(c.id); setSendAmt(t); }} />
                    <TouchableOpacity style={styles.sendBtn} onPress={() => {
                      const amt = Number(sendAmt || c.allowance);
                      if (amt > c.limits.perTransaction) { alert(`Blocked! Per Transaction Limit is Rs.${c.limits.perTransaction}. Cannot send Rs.${amt}`); return; }
                      if (amt > c.limits.daily) { alert(`Blocked! Daily Limit is Rs.${c.limits.daily}. Cannot send Rs.${amt}`); return; }
                      alert(`Rs.${amt} sent to ${c.name}`);
                    }}><Text style={[T(14), { color: '#0A235A', fontWeight: '800' }]}>Send Money</Text></TouchableOpacity>
                  </View>
                  <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[styles.cardTitle, T(15)]}>🚫 Limits</Text>
                      <Pressable onPress={() => openEditLimits(c)}><Text style={[styles.bold, T(13), { color: '#0A235A' }]}>Edit →</Text></Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}><Text style={[styles.muted, T(14)]}>Daily Limit</Text><Text style={[styles.bold, T(14)]}>Rs.{Math.round(c.spent / 7)} / Rs.{c.limits.daily} per day</Text></View>
                    <View style={styles.barBg}><View style={[styles.barFill, { width: `${dailyPct}%`, backgroundColor: dailyPct >= 90 ? '#DC2626' : dailyPct >= 70 ? '#E8A317' : '#8FA98F' }]} /></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}><Text style={[styles.muted, T(14)]}>Per Transaction Limit</Text><Text style={[styles.bold, T(14)]}>Max Rs.{c.limits.perTransaction}</Text></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}><Text style={[styles.muted, T(14)]}>Food Limit</Text><Text style={[styles.bold, T(14), { color: foodBlocked ? '#DC2626' : '#0A235A' }]}>Rs.{foodSpent} / Rs.{c.limits.food} {foodBlocked ? '⚠️ Blocked!' : ''}</Text></View>
                    <View style={styles.barBg}><View style={[styles.barFill, { width: `${foodPct}%`, backgroundColor: foodBlocked ? '#DC2626' : '#E8A317' }]} /></View>
                    {foodBlocked && <Text style={[styles.bold, T(12), { color: '#DC2626', marginTop: 4 }]}>Food spending blocked. Teen cannot spend more on Food.</Text>}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}><Text style={[styles.muted, T(14)]}>Games Limit</Text><Text style={[styles.bold, T(14), { color: gamesBlocked ? '#DC2626' : '#0A235A' }]}>Rs.{gamesSpent} / Rs.{c.limits.games} {gamesBlocked ? '⚠️ Blocked!' : ''}</Text></View>
                    <View style={styles.barBg}><View style={[styles.barFill, { width: `${Math.min(100, (gamesSpent / c.limits.games) * 100)}%`, backgroundColor: gamesBlocked ? '#DC2626' : '#0A235A' }]} /></View>
                    {gamesBlocked && <Text style={[styles.bold, T(12), { color: '#DC2626', marginTop: 4 }]}>Games spending blocked. Teen cannot spend more on Games.</Text>}
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
                <Text style={[styles.muted, T(13)]}>{c.cls} • @{c.username} • Spent Rs.{c.spent}</Text>
                <Text style={[styles.cardTitle, T(15), { marginTop: 12 }]}>{c.name}'s Pie Chart</Text>
                {Pie(c.categories)}
                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.cardTitle, T(15)]}>📚 Learning Progress</Text>
                    <Text style={[styles.bold, T(13), { backgroundColor: '#FFEFC2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' }]}>{c.learning.badge}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}><Text style={[styles.muted, T(14)]}>{c.learning.topic}</Text><Text style={[styles.bold, T(14)]}>{c.learning.done}/{c.learning.total} Lessons • {c.learning.progress}%</Text></View>
                  <View style={styles.barBg}><View style={[styles.barFill, { width: `${c.learning.progress}%`, backgroundColor: c.learning.progress >= 80 ? '#8FA98F' : c.learning.progress >= 50 ? '#E8A317' : '#C96F4A' }]} /></View>
                </View>
              </Pressable>
            ))}
            <View style={styles.card}><Text style={[styles.bigName, T(20)]}>Total Family</Text><Text style={[styles.statVal, T(20)]}>Rs.{CHILDREN.reduce((a, b) => a + b.balance, 0)}</Text><Text style={[styles.muted, T(13)]}>Combined Balance</Text></View>
          </View>
        )}

        {tab === 'history' && (
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={[styles.sectionTitle, T(18)]}>Your History - {child.name}</Text>
            {child.history.map((h, i) => (
              <View key={i} style={styles.card}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.bold, T(15)]}>{h.label}</Text><Text style={[styles.bold, T(15), { color: h.amt.includes('+') ? '#16A34A' : '#DC2626' }]}>{h.amt}</Text></View><Text style={[styles.muted, T(13)]}>{h.time}</Text></View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottom}>
        <Pressable onPress={() => setTab('home')} style={styles.navItem}><Text style={{ fontSize: 20 }}>🏠</Text><Text style={[styles.navTxt, T(10), tab === 'home' && styles.navActive]}>HOME</Text></Pressable>
        <Pressable onPress={() => setTab('allowance')} style={styles.navItem}><Text style={{ fontSize: 20 }}>💰</Text><Text style={[styles.navTxt, T(10), tab === 'allowance' && styles.navActive]}>Allowance</Text></Pressable>
        <Pressable onPress={() => setShowQR(true)} style={styles.qrBtn}><Text style={{ fontSize: 26 }}>📷</Text></Pressable>
        <Pressable onPress={() => setTab('overview')} style={styles.navItem}><Text style={{ fontSize: 20 }}>📊</Text><Text style={[styles.navTxt, T(10), tab === 'overview' && styles.navActive]}>Overview</Text></Pressable>
        <Pressable onPress={() => setTab('history')} style={styles.navItem}><Text style={{ fontSize: 20 }}>🕒</Text><Text style={[styles.navTxt, T(10), tab === 'history' && styles.navActive]}>Your History</Text></Pressable>
      </View>

      {/* EDIT LIMITS MODAL */}
      <Modal visible={showEditLimits} transparent animationType="fade">
        <View style={styles.centerWrap}><View style={styles.popup}>
          <Text style={[styles.drawerTitle, T(20)]}>🚫 Set Category Limits</Text>
          <Text style={[styles.muted, T(13), { marginTop: 4 }]}>Teen cannot spend more than these limits</Text>
          <Text style={[styles.muted, T(14)]}>Daily Limit (Rs.)</Text><TextInput style={[styles.input, T(15)]} value={editDaily} onChangeText={setEditDaily} placeholder="e.g. 100" keyboardType="numeric" />
          <Text style={[styles.muted, T(14)]}>Per Transaction Limit (Rs.)</Text><TextInput style={[styles.input, T(15)]} value={editPerTransaction} onChangeText={setEditPerTransaction} placeholder="e.g. 60" keyboardType="numeric" />
          <Text style={[styles.muted, T(14)]}>Food Limit (Rs.)</Text><TextInput style={[styles.input, T(15)]} value={editFood} onChangeText={setEditFood} placeholder="e.g. 150" keyboardType="numeric" />
          <Text style={[styles.muted, T(14)]}>Games Limit (Rs.)</Text><TextInput style={[styles.input, T(15)]} value={editGames} onChangeText={setEditGames} placeholder="e.g. 120" keyboardType="numeric" />
          <TouchableOpacity style={styles.sendBtn} onPress={saveLimits}><Text style={[T(15), { fontWeight: '800', color: '#0A235A' }]}>Save Limits</Text></TouchableOpacity>
          <Pressable onPress={() => setShowEditLimits(false)} style={{ marginTop: 10, alignItems: 'center' }}><Text style={T(14)}>Cancel</Text></Pressable>
        </View></View>
      </Modal>

      {/* PROFILE DRAWER */}
      <Modal visible={showProfile} transparent animationType="slide">
        <View style={styles.drawerWrap}>
          <View style={styles.drawerLeft}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.drawerTitle, T(21)]}>Profile</Text><Pressable onPress={() => setShowProfile(false)}><Text style={{ fontSize: 20 }}>✕</Text></Pressable></View>
              <View style={{ alignItems: 'center', marginTop: 16 }}><View style={[styles.avatar, { width: 80, height: 80, borderRadius: 40 }]}><Text style={{ fontSize: 32, fontWeight: '800', fontFamily: FONT_BODY }}>P</Text></View><Text style={[styles.bigName, T(20)]}>{parentName}</Text><Text style={[styles.muted, T(14)]}>{parentEmail} • {parentMobile}</Text>
                <Pressable onPress={() => { setShowProfile(false); setTimeout(() => setShowEditProfile(true), 200); }} style={styles.editBtn}><Text style={[T(14), { fontWeight: '700' }]}>✏️ Edit Profile</Text></Pressable></View>
              <Text style={[styles.cardTitle, T(16), { marginTop: 20 }]}>Accounts Attached</Text>
              {CHILDREN.map(c => <View key={c.id} style={styles.attachRow}><Text style={[styles.bold, T(15)]}>{c.name} • {c.cls}</Text><Text style={[styles.muted, T(14)]}>@{c.username}</Text></View>)}
              <Pressable onPress={() => { setShowProfile(false); setTimeout(() => setShowAddChild(true), 200); }} style={styles.attachRow}><Text style={[styles.bold, T(15)]}>+ Add Child</Text></Pressable>
              <Text style={[styles.muted, T(13), { marginTop: 16 }]}>Last Login: Today, 10:24 AM • Faridabad</Text>
              <Pressable style={[styles.logoutBtn, { marginTop: 20 }]}><Text style={[T(14), { fontWeight: '700' }]}>Logout from this device</Text></Pressable>
              <Pressable style={[styles.logoutBtn, { backgroundColor: '#FEE2E2' }]}><Text style={[T(14), { fontWeight: '700', color: '#DC2626' }]}>Logout from all devices</Text></Pressable>
            </ScrollView>
          </View>
          <Pressable style={{ flex: 1 }} onPress={() => setShowProfile(false)} />
        </View>
      </Modal>

      {/* SETTINGS DRAWER */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.drawerWrap}><Pressable style={{ flex: 1 }} onPress={() => setShowSettings(false)} /><View style={styles.drawerRight}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={[styles.drawerTitle, T(21)]}>SETTINGS</Text><Pressable onPress={() => setShowSettings(false)}><Text style={{ fontSize: 20 }}>✕</Text></Pressable></View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingBottom: 30 }}>
            <Text style={[styles.cardTitle, T(17)]}>Account</Text>
            <Row label="Change Email / Mobile No"><Chip label="Edit →" active onPress={() => { setShowSettings(false); setTimeout(() => { setTempEmail(parentEmail); setTempMobile(parentMobile); setOtpSent(false); setShowEditContact(true); }, 200); }} /></Row>
            <Row label="Change Password"><Chip label="Change →" active onPress={() => { setShowSettings(false); setTimeout(() => setShowChangePass(true), 200); }} /></Row>
            <Text style={[styles.cardTitle, T(17), { marginTop: 16 }]}>Notifications</Text>
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
            <Text style={[styles.cardTitle, T(17), { marginTop: 16 }]}>Support</Text>
            <Row label="Help & FAQ"><Chip label="Open →" active /></Row>
            <Row label="Contact Us / Report Problem"><Chip label="Contact →" active /></Row>
            <Pressable style={[styles.logoutBtn, { backgroundColor: '#FEE2E2', marginTop: 18 }]}><Text style={[T(15), { fontWeight: '800', color: '#DC2626' }]}>Delete Account</Text></Pressable>
          </ScrollView>
        </View></View>
      </Modal>

      {/* EDIT PROFILE */}
      <Modal visible={showEditProfile} transparent animationType="fade">
        <View style={styles.centerWrap}><View style={styles.popup}>
          <Text style={[styles.drawerTitle, T(20)]}>Edit Profile</Text>
          <Text style={[styles.muted, T(14)]}>Name</Text><TextInput style={[styles.input, T(15)]} value={parentName} onChangeText={setParentName} />
          <TouchableOpacity style={styles.sendBtn} onPress={() => setShowEditProfile(false)}><Text style={[T(15), { fontWeight: '800', color: '#0A235A' }]}>Save</Text></TouchableOpacity>
          <Pressable onPress={() => setShowEditProfile(false)} style={{ marginTop: 10, alignItems: 'center' }}><Text style={T(14)}>Cancel</Text></Pressable>
        </View></View>
      </Modal>

      {/* EDIT CONTACT + OTP VERIFY */}
      <Modal visible={showEditContact} transparent animationType="fade">
        <View style={styles.centerWrap}><View style={styles.popup}>
          <Text style={[styles.drawerTitle, T(20)]}>Change Email / Mobile No</Text>
          <Text style={[styles.muted, T(14)]}>New Email</Text><TextInput style={[styles.input, T(15)]} value={tempEmail} onChangeText={setTempEmail} placeholder="New Email" keyboardType="email-address" autoCapitalize="none" />
          <Text style={[styles.muted, T(14)]}>New Mobile No</Text><TextInput style={[styles.input, T(15)]} value={tempMobile} onChangeText={setTempMobile} placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
          {!otpSent ? (
            <TouchableOpacity style={styles.sendBtn} onPress={() => { if (!tempEmail && !tempMobile) { alert('Enter new Email or Mobile'); return; } setOtpSent(true); alert(`OTP sent to ${tempEmail || tempMobile} - Demo OTP: 1234`); }}><Text style={[T(15), { fontWeight: '800', color: '#0A235A' }]}>Send OTP</Text></TouchableOpacity>
          ) : (
            <>
              <Text style={[styles.muted, T(14)]}>Enter OTP sent to {tempEmail || tempMobile}</Text>
              <TextInput style={[styles.input, T(18)]} value={otp} onChangeText={setOtp} placeholder="• • • •" keyboardType="numeric" maxLength={4} textAlign="center" />
              <TouchableOpacity style={styles.sendBtn} onPress={() => { if (otp === '1234') { setParentEmail(tempEmail); setParentMobile(tempMobile); setShowEditContact(false); setOtpSent(false); setOtp(''); alert('Verified! Contact updated'); } else { alert('Wrong OTP! Demo OTP is 1234'); } }}><Text style={[T(15), { fontWeight: '800', color: '#0A235A' }]}>Verify & Save</Text></TouchableOpacity>
              <Pressable onPress={() => { setOtpSent(false); setOtp(''); }} style={{ marginTop: 8, alignItems: 'center' }}><Text style={[T(13), { color: '#C96F4A' }]}>Change Email / Number</Text></Pressable>
            </>
          )}
          <Pressable onPress={() => { setShowEditContact(false); setOtpSent(false); setOtp(''); }} style={{ marginTop: 10, alignItems: 'center' }}><Text style={T(14)}>Cancel</Text></Pressable>
        </View></View>
      </Modal>

      {/* CHANGE PASSWORD */}
      <Modal visible={showChangePass} transparent animationType="fade">
        <View style={styles.centerWrap}><View style={styles.popup}>
          <Text style={[styles.drawerTitle, T(20)]}>Change Password</Text>
          <Text style={[styles.muted, T(14)]}>Old Password</Text><TextInput style={[styles.input, T(15)]} secureTextEntry value={oldPass} onChangeText={setOldPass} placeholder="Old Password" />
          <Text style={[styles.muted, T(14)]}>New Password</Text><TextInput style={[styles.input, T(15)]} secureTextEntry value={newPass} onChangeText={setNewPass} placeholder="New Password" />
          <TouchableOpacity style={styles.sendBtn} onPress={() => { setShowChangePass(false); alert('Password changed'); }}><Text style={[T(15), { fontWeight: '800', color: '#0A235A' }]}>Update Password</Text></TouchableOpacity>
          <Pressable onPress={() => setShowChangePass(false)} style={{ marginTop: 10, alignItems: 'center' }}><Text style={T(14)}>Cancel</Text></Pressable>
        </View></View>
      </Modal>

      {/* ADD CHILD MODAL - NEW */}
      <Modal visible={showAddChild} transparent animationType="fade">
        <View style={styles.centerWrap}><View style={styles.popup}>
          <Text style={[styles.drawerTitle, T(20)]}>+ Add Child</Text>
          <Text style={[styles.muted, T(14)]}>Child Name *</Text><TextInput style={[styles.input, T(15)]} value={newChildName} onChangeText={setNewChildName} placeholder="e.g. Kabir" />
          <Text style={[styles.muted, T(14)]}>Username *</Text><TextInput style={[styles.input, T(15)]} value={newChildUsername} onChangeText={setNewChildUsername} placeholder="e.g. kabir_12" autoCapitalize="none" />
          <Text style={[styles.muted, T(14)]}>Email / Phone *</Text><TextInput style={[styles.input, T(15)]} value={newChildEmail} onChangeText={setNewChildEmail} placeholder="kabir@gmail.com / +91..." keyboardType="email-address" autoCapitalize="none" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Text style={[styles.muted, T(14)]}>Age</Text><TextInput style={[styles.input, T(15)]} value={newChildAge} onChangeText={setNewChildAge} placeholder="12" keyboardType="numeric" /></View>
            <View style={{ flex: 1.5 }}><Text style={[styles.muted, T(14)]}>Class</Text><TextInput style={[styles.input, T(15)]} value={newChildCls} onChangeText={setNewChildCls} placeholder="Class 7" /></View>
          </View>
          <TouchableOpacity style={styles.sendBtn} onPress={handleAddChild}><Text style={[T(15), { fontWeight: '800', color: '#0A235A' }]}>Add Child</Text></TouchableOpacity>
          <Pressable onPress={() => setShowAddChild(false)} style={{ marginTop: 10, alignItems: 'center' }}><Text style={T(14)}>Cancel</Text></Pressable>
        </View></View>
      </Modal>

      {/* SCAN QR */}
      <Modal visible={showQR} transparent animationType="fade">
        <View style={styles.centerWrap}><View style={styles.popup}>
          <Text style={[styles.drawerTitle, T(20)]}>Scan QR</Text><Text style={[styles.muted, T(14)]}>Send to {child.name}</Text>
          <View style={styles.qrBox}><Text style={{ fontSize: 60 }}>📷</Text><Text style={[styles.muted, T(13), { color: '#fff' }]}>Camera Preview Here</Text></View>
          <TextInput style={[styles.input, T(15)]} placeholder="Amount Rs." keyboardType="numeric" value={sendAmt} onChangeText={setSendAmt} />
          <TouchableOpacity style={styles.sendBtn} onPress={() => { alert(`Rs.${sendAmt} sent to ${child.name} via QR`); setShowQR(false); }}><Text style={[T(15), { fontWeight: '800', color: '#0A235A' }]}>Send via QR</Text></TouchableOpacity>
          <Pressable onPress={() => setShowQR(false)} style={{ marginTop: 12, alignItems: 'center' }}><Text style={T(14)}>Close</Text></Pressable>
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