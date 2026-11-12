import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { api, errorText } from '../lib/api';

type Txn = { id: string, name: string, category: string, amount: number, type: 'spent' | 'saved', date: string, month: string, year: string };

// --- AUTO MONTH / YEAR ---
const ALL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const NOW = new Date();
const CURRENT_MONTH = ALL_MONTHS[NOW.getMonth()]; // November
const CURRENT_YEAR = NOW.getFullYear().toString(); // 2026
// Year auto - 2025 se Current Year tak, naya saal aate hi apne aap badh jayega
// 2026 me = ['2025','2026'], 2027 me apne aap = ['2025','2026','2027']
const YEARS = Array.from({ length: NOW.getFullYear() - 2024 }, (_, i) => (2025 + i).toString());

const INITIAL_CATEGORIES = ['Food', 'Games', 'Savings', 'Topup'];

const BADGE_NAMES: Record<string, { title: string; sub: string }> = {
  first_goal: { title: '🎯 First Goal', sub: 'Created your first savings goal' },
  first_lesson: { title: '📘 First Lesson', sub: 'Passed your first quiz' },
  all_lessons: { title: '🏆 Money Master', sub: 'Finished every lesson' },
  goal_reached: { title: '🐷 Goal Reached', sub: 'Saved a full goal' },
};
const cap = (x: string) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x);

export default function Transactions() {
  const router = useRouter();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loadError, setLoadError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [vouchersOpen, setVouchersOpen] = useState(false);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Filters - Default = Current Month + Current Year
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [minAmt, setMinAmt] = useState('');
  const [maxAmt, setMaxAmt] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');

  // Category Add / Remove
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState('');

  // 1. REAL FETCH FROM BACKEND
  useEffect(() => {
    (async () => {
      try {
        const [t, b] = await Promise.all([api('/transactions?limit=200'), api('/badges')]);
        setTxns((t.transactions || []).map((x: any): Txn => {
          const d = new Date(x.created_at);
          const rs = x.amount_paise / 100;
          const name = x.type === 'topup' ? 'Top-up from parent' : x.type === 'save' ? (x.merchant || 'Saved to goal') : `${cap(x.category || 'Spend')}${x.merchant ? ' - ' + x.merchant : ''}`;
          return {
            id: x.id, name, category: cap(x.category || (x.type === 'topup' ? 'topup' : 'other')), amount: rs,
            type: rs >= 0 ? 'saved' : 'spent',
            date: `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`,
            month: ALL_MONTHS[d.getMonth()], year: String(d.getFullYear()),
          };
        }));
        setVouchers((b.badges || []).map((x: any) => ({ id: x.code, ...(BADGE_NAMES[x.code] || { title: x.code, sub: 'Badge earned' }) })));
      } catch (e) { setLoadError(errorText(e)); }
    })();
  }, []);

  // 2. CHECK BALANCE - Eye + Button both use this
  const checkBalance = async () => {
    if (showBalance) { setShowBalance(false); return; }
    try {
      const w = await api('/wallet');
      setBalance(w.balancePaise / 100);
      setShowBalance(true);
    } catch (e) { Alert.alert('Could not get balance', errorText(e)); }
  };

  // Clear All Filters - Sab reset + Current Month pe wapas
  const clearAllFilters = () => {
    setSelectedCat('All');
    setSelectedMonth(CURRENT_MONTH);
    setSelectedYear(CURRENT_YEAR);
    setMinAmt('');
    setMaxAmt('');
    setSelectedDate('');
    setSearch('');
  };

  const addCategory = () => {
    if (!newCat.trim()) return;
    if (categories.includes(newCat.trim())) {
      Alert.alert('Already exists', 'This category already exists');
      return;
    }
    setCategories([...categories, newCat.trim()]);
    setNewCat('');
    setShowAddCat(false);
  };

  const removeCategory = (cat: string) => {
    Alert.alert('Remove Category', `Remove ${cat}?`, [
      { text: 'Cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => {
          setCategories(categories.filter(c => c !== cat));
          if (selectedCat === cat) setSelectedCat('All');
        }
      },
    ]);
  };

  // 3. FILTER LOGIC
  const filtered = useMemo(() => txns.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedMonth !== 'All' && t.month !== selectedMonth) return false;
    if (selectedYear !== 'All' && t.year !== selectedYear) return false;
    if (selectedCat !== 'All' && t.category !== selectedCat) return false;
    if (minAmt && Math.abs(t.amount) < Number(minAmt)) return false;
    if (maxAmt && Math.abs(t.amount) > Number(maxAmt)) return false;
    if (selectedDate && !t.date.includes(selectedDate)) return false;
    return true;
  }), [txns, search, selectedMonth, selectedYear, selectedCat, minAmt, maxAmt, selectedDate]);

  // 4. AI CATEGORIZATION - Month wise AI Summary
  const aiSummary = useMemo(() => {
    const map: any = {};
    filtered.forEach(t => {
      if (t.type === 'spent') map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map);
  }, [filtered]);

  const months = [...new Set(filtered.map(t => `${t.month} ${t.year}`))];

  const voucherList = vouchers;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.headerTitle}>Transaction & History</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.section}>Accounts</Text>
        <View style={s.accountRow}>
          {/* CHECK BALANCE CARD */}
          <View style={s.accountCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 12 }}>Account Balance</Text>
              <TouchableOpacity onPress={checkBalance}><Text style={{ fontSize: 16 }}>{showBalance ? '👁️' : '🙈'}</Text></TouchableOpacity>
            </View>
            <Text style={s.accountBal}>{showBalance ? `₹${balance ?? '...'}` : '₹ • • • •'}</Text>
            <View style={s.line} />
            <TouchableOpacity style={s.checkBtn} onPress={checkBalance}>
              <Text style={s.checkText}>{showBalance ? 'Hide Balance' : 'Check Balance'}</Text>
            </TouchableOpacity>
          </View>

          {/* VOUCHERS CARD */}
          <TouchableOpacity style={[s.accountCard, { backgroundColor: '#002E6E' }]} onPress={() => setVouchersOpen(!vouchersOpen)}>
            <Text style={s.voucherTitle}>My</Text>
            <Text style={s.voucherTitle}>Badges</Text>
            <Text style={s.voucherTitle}>🏅</Text>
            <Text style={{ color: '#FFD93D', textAlign: 'center', fontSize: 11, marginTop: 4 }}>{vouchersOpen ? '▲ Close' : '▼ View All'}</Text>
          </TouchableOpacity>
        </View>

        {/* VOUCHERS DROPDOWN */}
        {vouchersOpen && (
          <View style={s.voucherDrop}>
            <Text style={s.voucherDropTitle}>{voucherList.length ? 'Your Badges - Swipe →' : 'No badges yet. Finish a lesson or create a goal!'}</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={voucherList}
              keyExtractor={(item, idx) => `${item.id}-${idx}`}
              renderItem={({ item }) => (
                <View style={s.voucherItem}>
                  <Text style={s.voucherItemTitle}>{item.title}</Text>
                  <Text style={s.voucherItemSub}>{item.sub}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* AI SUMMARY */}
        <View style={s.aiCard}>
          <Text style={s.aiTitle}>✨ Spending Insights</Text>
          {loadError ? <Text style={s.aiText}>{loadError}</Text> : null}
          {aiSummary.length === 0 ? <Text style={s.aiText}>No spending yet. AI will categorize here.</Text> :
            aiSummary.map(([cat, amt]: any) => (
              <Text key={cat} style={s.aiText}>• You spent ₹{amt} on {cat} this month</Text>
            ))}
        </View>

        <Text style={[s.section, { marginTop: 18 }]}>Payment History</Text>
        <View style={s.searchRow}>
          <View style={s.searchBox}><Text>🔍</Text><TextInput placeholder="Search your payments" value={search} onChangeText={setSearch} style={s.searchInput} placeholderTextColor="#888" /></View>
          <TouchableOpacity style={s.filterBtn} onPress={() => setFilterOpen(true)}><Text style={{ fontSize: 16, color: '#fff', fontWeight: '800' }}>Filter</Text></TouchableOpacity>
        </View>

        {/* Active Filter Show - kya laga hua hai */}
        {(selectedCat !== 'All' || selectedMonth !== CURRENT_MONTH || selectedYear !== CURRENT_YEAR || minAmt || maxAmt || selectedDate) && (
          <View style={s.activeFilterRow}>
            <Text style={s.activeFilterText}>Showing: {selectedMonth} {selectedYear} {selectedCat !== 'All' ? `• ${selectedCat}` : ''}</Text>
            <TouchableOpacity onPress={clearAllFilters}><Text style={s.activeClear}>Clear ✕</Text></TouchableOpacity>
          </View>
        )}

        {/* MONTH GROUPS - Paytm Style */}
        {months.length === 0 && <Text style={s.noData}>No transactions found.</Text>}
        {months.map(m => {
          const list = filtered.filter(t => `${t.month} ${t.year}` === m);
          const total = list.filter(t => t.type === 'spent').reduce((sum, t) => sum + Math.abs(t.amount), 0);
          return (
            <View key={m}>
              <View style={s.monthRow}><Text style={s.monthTitle}>{m}</Text><View style={{ alignItems: 'flex-end' }}><Text style={s.totalLabel}>Total Spent</Text><Text style={s.totalAmt}>₹{total}</Text></View></View>
              {list.map(t => (
                <View key={t.id} style={s.card}>
                  <View style={s.iconBox}><Text style={{ fontSize: 20 }}>{t.category === 'Food' ? '🍔' : t.category === 'Stationery' ? '📚' : t.category === 'Saving' ? '🐷' : '💸'}</Text></View>
                  <View style={{ flex: 1, marginLeft: 12 }}><Text style={s.cardName}>{t.name}</Text><Text style={s.cardDetail}>{t.category} • {t.date}</Text></View>
                  <Text style={[s.cardAmt, { color: t.type === 'spent' ? '#E53935' : '#00A651' }]}>{t.type === 'spent' ? '-' : '+'}₹{Math.abs(t.amount)}</Text>
                </View>
              ))}
            </View>
          );
        })}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* FILTER MODAL */}
      <Modal visible={filterOpen} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            {/* Header + Cross */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)} style={s.crossBtn}><Text style={s.crossText}>✕</Text></TouchableOpacity>
            </View>

            <Text style={s.filterLabel}>By Category</Text>
            <View style={s.chipRow}>
              <TouchableOpacity onPress={() => setSelectedCat('All')} style={[s.chip, selectedCat === 'All' && s.chipActive]}><Text style={[s.chipText, selectedCat === 'All' && { color: '#fff' }]}>All</Text></TouchableOpacity>
              {categories.map(c => (
                <View key={c} style={[s.chip, selectedCat === c && s.chipActive, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <TouchableOpacity onPress={() => setSelectedCat(c)}><Text style={[s.chipText, selectedCat === c && { color: '#fff' }]}>{c}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => removeCategory(c)}><Text style={[s.chipText, selectedCat === c && { color: '#fff' }, { fontSize: 11 }]}>✕</Text></TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={() => setShowAddCat(true)} style={[s.chip, { backgroundColor: '#FFD93D', borderColor: '#FFD93D' }]}><Text style={[s.chipText, { color: '#002E6E' }]}>+ Add</Text></TouchableOpacity>
            </View>

            <Text style={s.filterLabel}>By Month</Text>
            <View style={s.chipRow}>
              <TouchableOpacity onPress={() => setSelectedMonth('All')} style={[s.chip, selectedMonth === 'All' && s.chipActive]}><Text style={[s.chipText, selectedMonth === 'All' && { color: '#fff' }]}>All</Text></TouchableOpacity>
              {ALL_MONTHS.map(mo => (
                <TouchableOpacity key={mo} onPress={() => setSelectedMonth(mo)} style={[s.chip, selectedMonth === mo && s.chipActive, mo === CURRENT_MONTH && s.currentChip]}><Text style={[s.chipText, selectedMonth === mo && { color: '#fff' }]}>{mo} {mo === CURRENT_MONTH ? '•' : ''}</Text></TouchableOpacity>
              ))}
            </View>

            <Text style={s.filterLabel}>By Year</Text>
            <View style={s.chipRow}>
              <TouchableOpacity onPress={() => setSelectedYear('All')} style={[s.chip, selectedYear === 'All' && s.chipActive]}><Text style={[s.chipText, selectedYear === 'All' && { color: '#fff' }]}>All</Text></TouchableOpacity>
              {YEARS.map(y => (
                <TouchableOpacity key={y} onPress={() => setSelectedYear(y)} style={[s.chip, selectedYear === y && s.chipActive]}><Text style={[s.chipText, selectedYear === y && { color: '#fff' }]}>{y} {y === CURRENT_YEAR ? '•' : ''}</Text></TouchableOpacity>
              ))}
            </View>

            <Text style={s.filterLabel}>Min Amount</Text>
            <TextInput placeholder="e.g. 100" value={minAmt} onChangeText={setMinAmt} keyboardType="numeric" style={s.input} />
            <Text style={s.filterLabel}>Max Amount</Text>
            <TextInput placeholder="e.g. 1000" value={maxAmt} onChangeText={setMaxAmt} keyboardType="numeric" style={s.input} />
            <Text style={s.filterLabel}>By Date (DD-MM-YYYY)</Text>
            <TextInput placeholder="e.g. 10-11-2026" value={selectedDate} onChangeText={setSelectedDate} style={s.input} />

            <TouchableOpacity style={s.applyBtn} onPress={() => setFilterOpen(false)}><Text style={{ color: '#fff', fontWeight: '900' }}>Apply Filters</Text></TouchableOpacity>

            {/* Clear All Filters - Bada Button */}
            <TouchableOpacity style={s.clearBtn} onPress={() => { clearAllFilters(); setFilterOpen(false); }}>
              <Text style={s.clearBtnText}>Clear All Filters ✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Category Popup */}
      <Modal visible={showAddCat} transparent animationType="fade">
        <View style={s.centerBg}>
          <View style={s.smallModal}>
            <Text style={s.modalTitle}>Add Category</Text>
            <TextInput style={s.input} value={newCat} onChangeText={setNewCat} placeholder="e.g. Travel, Toys, Books" autoFocus />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setShowAddCat(false)} style={[s.smallBtn, { backgroundColor: '#eee' }]}><Text style={{ fontWeight: '800' }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={addCategory} style={[s.smallBtn, { backgroundColor: '#002E6E' }]}><Text style={{ fontWeight: '800', color: '#fff' }}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#002E6E' },
  back: { fontSize: 26, fontWeight: '900', color: '#fff' },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#fff', marginLeft: 10 },
  section: { fontSize: 16, fontWeight: '800', color: '#002E6E', marginLeft: 16, marginTop: 16 },
  accountRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 10 },
  accountCard: { flex: 1, backgroundColor: '#002E6E', borderRadius: 14, padding: 14, minHeight: 115, justifyContent: 'center' },
  accountBal: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 6 },
  line: { height: 1, backgroundColor: '#fff', opacity: 0.4, marginVertical: 8 },
  checkBtn: { backgroundColor: '#FFD93D', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  checkText: { fontSize: 11, fontWeight: '800', color: '#002E6E' },
  voucherTitle: { color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center', lineHeight: 22 },
  voucherDrop: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 12 },
  voucherDropTitle: { fontWeight: '800', color: '#002E6E', marginBottom: 8 },
  voucherItem: { width: 140, backgroundColor: '#FFF8D6', borderRadius: 12, padding: 12, marginRight: 10, borderWidth: 1, borderColor: '#FFD93D' },
  voucherItemTitle: { fontSize: 16, fontWeight: '900', color: '#002E6E' },
  voucherItemSub: { fontSize: 11, color: '#666', marginTop: 4 },
  voucherClaim: { color: '#00A651', fontWeight: '800', fontSize: 12, marginTop: 8 },
  aiCard: { backgroundColor: '#E8F5E9', marginHorizontal: 16, marginTop: 14, borderRadius: 14, padding: 12 },
  aiTitle: { fontWeight: '900', color: '#1B5E20' },
  aiText: { fontSize: 12, color: '#2E7D32', marginTop: 4 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 10, gap: 10, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: '#E0E0E0' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: '#000' },
  filterBtn: { paddingHorizontal: 16, height: 44, backgroundColor: '#002E6E', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  activeFilterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 10, backgroundColor: '#E8F0FE', borderRadius: 10, padding: 10 },
  activeFilterText: { fontSize: 12, fontWeight: '800', color: '#002E6E', flex: 1 },
  activeClear: { fontSize: 12, fontWeight: '900', color: '#E53935' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  monthTitle: { fontSize: 15, fontWeight: '800', color: '#333' },
  totalLabel: { fontSize: 11, color: '#888' },
  totalAmt: { fontSize: 15, fontWeight: '900', color: '#000' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 14, fontWeight: '800', color: '#111' },
  cardDetail: { fontSize: 11, color: '#888', marginTop: 2 },
  cardAmt: { fontSize: 14, fontWeight: '900' },
  noData: { textAlign: 'center', marginTop: 30, color: '#888', paddingHorizontal: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0' },
  chipActive: { backgroundColor: '#002E6E', borderColor: '#002E6E' },
  currentChip: { borderColor: '#FFD93D', borderWidth: 1.5 },
  chipText: { fontSize: 12, fontWeight: '800', color: '#002E6E' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#002E6E' },
  crossBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
  crossText: { fontSize: 14, fontWeight: '900', color: '#002E6E' },
  filterLabel: { fontSize: 13, fontWeight: '800', color: '#333', marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 10, marginTop: 6 },
  applyBtn: { backgroundColor: '#002E6E', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 18 },
  clearBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E53935', padding: 13, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  clearBtnText: { color: '#E53935', fontWeight: '900', fontSize: 14 },
  centerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  smallModal: { backgroundColor: '#fff', width: '85%', borderRadius: 16, padding: 16 },
  smallBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
});