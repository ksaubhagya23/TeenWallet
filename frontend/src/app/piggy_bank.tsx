import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { api, errorText } from '../lib/api';

// amount = rupees saved so far, target = rupees needed (backend sends paise)
type Goal = { id: string, name: string, amount: number, target: number, color: string, emoji: string };

const COLORS = ['#FFC93C', '#4D96FF', '#6BCB77', '#FF6B9D', '#B983FF', '#FF9F45'];
const EMOJIS = ['🚨', '🚲', '✈️', '🎧', '🎮', '📱', '🐷', '📚'];

export default function PiggyBank() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundType, setSoundType] = useState<'Coin Collect' | 'Cash Register'>('Coin Collect');
  const [volume, setVolume] = useState(70);
  const [sound, setSound] = useState<any>(null);

  // Add to Savings - Category select
  const [showAdd, setShowAdd] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [addAmount, setAddAmount] = useState('50');

  // Add / Edit Category
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('🐷');
  const [catColor, setCatColor] = useState(COLORS[0]);

  const [busy, setBusy] = useState(false);
  const [catTarget, setCatTarget] = useState('500');

  const loadGoals = async () => {
    try {
      const r = await api('/goals');
      setGoals((r.goals || []).map((g: any, i: number) => ({
        id: g.id, name: g.title, amount: g.savedPaise / 100, target: g.targetPaise / 100,
        color: COLORS[i % COLORS.length], emoji: EMOJIS[i % EMOJIS.length],
      })));
    } catch (e) { Alert.alert('Could not load goals', errorText(e)); }
  };

  useEffect(() => { loadGoals(); }, []);

  const total = goals.reduce((s, g) => s + g.amount, 0);

  // Uses expo-audio (works in Expo Go). Loaded only when needed,
  // so the screen still opens even if sound is not available.
  const playSound = () => {
    try {
      const file = soundType === 'Coin Collect'
        ? require('../../assets/sounds/coin.mp3')
        : require('../../assets/sounds/cash.mp3');
      const { createAudioPlayer } = require('expo-audio');
      if (sound) { try { sound.remove(); } catch { /* ignore */ } }
      const player = createAudioPlayer(file);
      player.volume = volume / 100;
      player.play();
      setSound(player);
    } catch {
      console.log('Sound not available - check assets/sounds/');
    }
  };

  // Circular Pie Chart - Donut
  const renderCircularPie = () => {
    if (total === 0) return <View style={s.pieEmpty}><Text style={{ color: '#888' }}>No savings yet</Text></View>;
    const R = 70;
    const C = 2 * Math.PI * R;
    let offset = 0;
    return (
      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <View style={{ width: 180, height: 180 }}>
          <Svg width={180} height={180} viewBox="0 0 180 180">
            {goals.map((g) => {
              const frac = g.amount / total;
              const dash = frac * C;
              const el = (
                <Circle
                  key={g.id}
                  cx={90} cy={90} r={R}
                  fill="transparent"
                  stroke={g.color}
                  strokeWidth={28}
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-offset}
                  rotation={-90}
                  origin="90, 90"
                />
              );
              offset += dash;
              return el;
            })}
          </Svg>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 12, color: '#888', fontWeight: '700' }}>Total</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1A1A' }}>₹{total}</Text>
          </View>
        </View>
        <View style={s.legendRow}>
          {goals.map((g) => (
            <View key={g.id} style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: g.color }]} />
              <Text style={s.legend}>{g.emoji} {g.name} • {Math.round((g.amount / total) * 100)}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const openAddCategory = () => {
    setEditingId(null);
    setCatName('');
    setCatEmoji('🐷');
    setCatColor(COLORS[goals.length % COLORS.length]);
    setCatTarget('500');
    setShowCatModal(true);
  };

  const openEditCategory = (g: Goal) => {
    setEditingId(g.id);
    setCatName(g.name);
    setCatEmoji(g.emoji);
    setCatColor(g.color);
    setShowCatModal(true);
  };

  // Creates a real savings goal on the server
  const saveCategory = async () => {
    const target = Number(catTarget);
    if (!catName.trim()) { Alert.alert('Error', 'Please enter a goal name'); return; }
    if (!Number.isFinite(target) || target < 1) { Alert.alert('Error', 'Enter the target amount in rupees (at least 1)'); return; }
    setBusy(true);
    try {
      await api('/goals', { method: 'POST', body: { title: catName.trim(), targetPaise: Math.round(target * 100) } });
      setShowCatModal(false);
      await loadGoals();
    } catch (e) { Alert.alert('Could not create goal', errorText(e)); }
    finally { setBusy(false); }
  };

  // Moves money from the wallet into the goal (server checks balance)
  const confirmAddToSavings = async () => {
    const amt = Number(addAmount) || 0;
    if (!selectedGoalId) { Alert.alert('Select Goal', 'Please select a goal first'); return; }
    if (amt <= 0) { Alert.alert('Enter Amount', 'Please enter a valid amount'); return; }
    setBusy(true);
    try {
      const r = await api(`/goals/${selectedGoalId}/contribute`, { method: 'POST', body: { amountPaise: Math.round(amt * 100) } });
      playSound();
      setShowAdd(false);
      setAddAmount('50');
      await loadGoals();
      Alert.alert('Saved!', `₹${amt} added. Wallet balance now ₹${r.balancePaise / 100}.${r.newBadges?.length ? ' 🏅 Goal reached!' : ''}`);
    } catch (e) { Alert.alert('Could not save', errorText(e)); }
    finally { setBusy(false); }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.headerTitle}>MY SAVINGS</Text>
        <TouchableOpacity onPress={() => setMenuOpen(true)}><Text style={s.menuIcon}>☰</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={playSound} style={s.pigBox} activeOpacity={0.9}>
          <Image source={require('../../assets/piggy.png')} style={s.piggyImg} />
          <Text style={s.tapText}>Tap Pig to hear {soundType}</Text>
          <Text style={s.volumeText}>Volume: {volume}  •  Sound: {soundType}</Text>
        </TouchableOpacity>

        <Text style={s.totalText}>Total Savings = ₹{total}</Text>

        <View style={s.catCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.catTitle}>Category :-</Text>
            <TouchableOpacity onPress={openAddCategory} style={s.addCatBtn}><Text style={s.addCatText}>+ Add Category</Text></TouchableOpacity>
          </View>

          {goals.length === 0 && <Text style={s.catLine}>No goals yet. Tap + Add Category to make one.</Text>}
          {goals.map(g => (
            <View key={g.id} style={s.catRow}>
              <View style={[s.dot, { backgroundColor: g.color }]} />
              <Text style={s.catLine}>{g.emoji} {g.name} = ₹{g.amount} / ₹{g.target}</Text>
              <Text style={s.catPerc}>{total ? Math.round((g.amount / total) * 100) : 0}%</Text>
            </View>
          ))}

          <Text style={[s.catTitle, { marginTop: 16 }]}>Savings Breakdown</Text>
          {renderCircularPie()}
        </View>

        <TouchableOpacity
          style={s.addBtn}
          onPress={() => {
            if (!goals.length) { Alert.alert('Add Category', 'Please add a category first'); return; }
            setSelectedGoalId(goals[0].id);
            setShowAdd(true);
          }}
        >
          <Text style={s.addBtnText}>+ Add to Savings</Text>
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Add to Savings - Category Select */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.modalTitle}>Add to Savings</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={{ fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{ color: '#666', fontWeight: '700', marginTop: 12 }}>Select Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {goals.map(g => (
                <TouchableOpacity key={g.id} onPress={() => setSelectedGoalId(g.id)} style={[s.chip, { backgroundColor: selectedGoalId === g.id ? g.color : '#F3E8FF', borderColor: g.color }]}>
                  <Text style={{ fontWeight: '900', color: selectedGoalId === g.id ? '#fff' : '#3B1F5E' }}>{g.emoji} {g.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: '#666', fontWeight: '700', marginTop: 16 }}>Amount (₹)</Text>
            <TextInput style={s.input} value={addAmount} onChangeText={setAddAmount} keyboardType="numeric" placeholder="Enter amount" />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {['50', '100', '200', '500'].map(v => (
                <TouchableOpacity key={v} onPress={() => setAddAmount(v)} style={[s.chip, { backgroundColor: addAmount === v ? '#3B1F5E' : '#F3E8FF' }]}>
                  <Text style={{ fontWeight: '900', color: addAmount === v ? '#fff' : '#3B1F5E' }}>₹{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={confirmAddToSavings} disabled={busy}><Text style={{ color: '#fff', fontWeight: '900' }}>Add ₹{addAmount || 0} to Savings</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Category */}
      <Modal visible={showCatModal} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.modalTitle}>New Savings Goal</Text>
              <TouchableOpacity onPress={() => setShowCatModal(false)}><Text style={{ fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{ color: '#666', fontWeight: '700', marginTop: 12 }}>Category Name</Text>
            <TextInput style={s.input} value={catName} onChangeText={setCatName} placeholder="e.g. Cycle, Headphones, Emergency" autoFocus />
            <Text style={{ color: '#666', fontWeight: '700', marginTop: 12 }}>Target (₹)</Text>
            <TextInput style={s.input} value={catTarget} onChangeText={setCatTarget} keyboardType="numeric" placeholder="e.g. 2000" />
            <Text style={{ color: '#666', fontWeight: '700', marginTop: 12 }}>Emoji</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {EMOJIS.map(e => (
                <TouchableOpacity key={e} onPress={() => setCatEmoji(e)} style={[s.emojiBtn, { backgroundColor: catEmoji === e ? '#FFC93C' : '#F3E8FF' }]}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: '#666', fontWeight: '700', marginTop: 12 }}>Color</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setCatColor(c)} style={[s.colorBtn, { backgroundColor: c, borderWidth: catColor === c ? 3 : 0, borderColor: '#3B1F5E' }]} />
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={saveCategory} disabled={busy}><Text style={{ color: '#fff', fontWeight: '900' }}>Create Goal</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Settings */}
      <Modal visible={menuOpen} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setMenuOpen(false)}><Text style={{ fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>

            <Text style={s.menuBoxTitle}>SOUND</Text>
            {(['Coin Collect', 'Cash Register'] as const).map(opt => (
              <TouchableOpacity key={opt} onPress={() => setSoundType(opt)} style={[s.soundOpt, soundType === opt && s.soundOptActive]}>
                <Text style={[s.soundOptText, soundType === opt && { color: '#fff', fontWeight: '900' }]}>{opt} {soundType === opt ? '✓' : ''}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[s.menuBoxTitle, { marginTop: 20 }]}>VOLUME</Text>
            <View style={s.sliderRow}>
              <Text style={s.sliderNum}>0</Text>
              <View style={s.sliderTrack}>
                <View style={[s.sliderFill, { width: `${volume}%` }]} />
                <View style={[s.sliderThumb, { left: `${volume}%` }]} />
              </View>
              <Text style={s.sliderNum}>100</Text>
            </View>

            <View style={s.volBtnRow}>
              <TouchableOpacity style={s.volBtn} onPress={() => setVolume(Math.max(0, volume - 10))}><Text style={s.volBtnText}>- 10</Text></TouchableOpacity>
              <Text style={{ fontWeight: '900', fontSize: 18, color: '#3B1F5E' }}>{volume}</Text>
              <TouchableOpacity style={s.volBtn} onPress={() => setVolume(Math.min(100, volume + 10))}><Text style={s.volBtnText}>+ 10</Text></TouchableOpacity>
            </View>
            <Text style={s.note}>Volume {volume} • Sound {soundType} • Tap Pig to test</Text>

            <TouchableOpacity style={s.saveBtn} onPress={() => setMenuOpen(false)}><Text style={{ color: '#fff', fontWeight: '900' }}>Done</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E1' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 6, backgroundColor: '#FFF8E1' },
  back: { fontSize: 26, fontWeight: '900', color: '#3B1F5E' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', letterSpacing: 1 },
  menuIcon: { fontSize: 26, color: '#3B1F5E', fontWeight: '900' },
  pigBox: { alignItems: 'center', marginTop: 4, padding: 6 },
  piggyImg: { width: 230, height: 210, resizeMode: 'contain' },
  tapText: { fontSize: 12, color: '#888', marginTop: 2 },
  volumeText: { fontSize: 12, fontWeight: '800', color: '#3B1F5E', marginTop: 2 },
  totalText: { fontSize: 19, fontWeight: '900', color: '#1A1A1A', marginLeft: 20, marginTop: 10 },
  catCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  catTitle: { fontSize: 15, fontWeight: '900', color: '#1A1A1A' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  catLine: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1 },
  catPerc: { fontSize: 12, fontWeight: '800', color: '#3B1F5E' },
  pieEmpty: { height: 50, alignItems: 'center', justifyContent: 'center' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legend: { fontSize: 11, color: '#666', fontWeight: '700' },
  addBtn: { backgroundColor: '#FFC93C', marginHorizontal: 16, marginTop: 16, padding: 15, borderRadius: 16, alignItems: 'center', shadowColor: '#FFC93C', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  addBtnText: { fontWeight: '900', color: '#3B1F5E', fontSize: 15 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  menuBoxTitle: { fontSize: 15, fontWeight: '900', textAlign: 'center', borderWidth: 1.5, borderColor: '#3B1F5E', borderRadius: 8, paddingVertical: 8, marginTop: 14, color: '#3B1F5E' },
  soundOpt: { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  soundOptActive: { backgroundColor: '#3B1F5E', borderColor: '#3B1F5E' },
  soundOptText: { fontSize: 14, fontWeight: '700', color: '#333' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  sliderNum: { fontWeight: '800', color: '#666' },
  sliderTrack: { flex: 1, height: 6, backgroundColor: '#EDE7F6', borderRadius: 3, position: 'relative' },
  sliderFill: { height: 6, backgroundColor: '#3B1F5E', borderRadius: 3 },
  sliderThumb: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFC93C', borderWidth: 2, borderColor: '#3B1F5E', top: -6 },
  volBtnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  volBtn: { backgroundColor: '#F3E8FF', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  volBtnText: { fontWeight: '900', color: '#3B1F5E' },
  note: { textAlign: 'center', color: '#888', fontSize: 11, marginTop: 12 },
  saveBtn: { backgroundColor: '#3B1F5E', padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 14 },
  addCatBtn: { backgroundColor: '#FFC93C', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addCatText: { fontWeight: '900', color: '#3B1F5E', fontSize: 12 },
  iconBtn: { padding: 6, marginLeft: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  input: { backgroundColor: '#F3E8FF', borderRadius: 12, padding: 14, marginTop: 8, fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: '#E0E0E0' },
  emojiBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  colorBtn: { width: 36, height: 36, borderRadius: 18 },
});
