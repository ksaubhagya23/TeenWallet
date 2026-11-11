import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

const OPTIONS = [
  { id: 'fd', name: 'Fixed Deposit', emoji: '🏦', risk: 'Safe', return: 7, color: '#4D96FF', desc: 'Safe and steady growth in a bank', bestFor: 'Beginners who want zero risk', min: 100, detail: 'Your money stays safe in the bank. Low return but no loss. Good for short goals.' },
  { id: 'gold', name: 'Digital Gold', emoji: '🪙', risk: 'Medium', return: 11, color: '#FFD93D', desc: 'Gold, with small ups and downs', bestFor: 'Long-term savings and festivals', min: 100, detail: 'You buy real 24 Carat gold in small amounts. Gold price goes up and down, but usually grows over years.' },
  { id: 'index', name: 'Index Fund', emoji: '📈', risk: 'Medium', return: 14, color: '#B983FF', desc: 'Money in Top 50 companies', bestFor: 'Long-term wealth building', min: 100, detail: 'Your money is spread across Top 50 companies in India. Less risky than single stocks.' },
  { id: 'stock', name: 'Stocks', emoji: '🚀', risk: 'Risky', return: 20, color: '#FF6B9D', desc: 'High risk, high return', bestFor: 'Teens who can handle risk', min: 100, detail: 'You buy a small part of one company. It can grow very fast, but can also fall fast. Learn first.' },
];

// Mock Live Gold Price - 24 Carat, per 1 gram
const BASE_GOLD_PRICE = 9845;

export default function Investment() {
  const router = useRouter();
  const [selected, setSelected] = useState(OPTIONS[2]);
  const [amount, setAmount] = useState(500);
  const [months, setMonths] = useState(12);
  const [invested, setInvested] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [goldPrice, setGoldPrice] = useState(BASE_GOLD_PRICE);
  const [goldUp, setGoldUp] = useState(true);

  // Live Gold Price - small change every 4 sec like real market
  useEffect(() => {
    const t = setInterval(() => {
      setGoldPrice((p) => {
        const change = Math.floor(Math.random() * 21) - 10;
        setGoldUp(change >= 0);
        return Math.max(9700, Math.min(10000, p + change));
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Auto Calculate
  const yearlyReturn = selected.return / 100;
  const expected = Math.round(amount * Math.pow(1 + yearlyReturn, months / 12));
  const profit = expected - amount;
  const goldGrams = (amount / goldPrice).toFixed(3);
  const goldFutureGramsValue = Math.round(parseFloat(goldGrams) * goldPrice * Math.pow(1 + 0.11, months / 12));

  // Line Chart Data - Growth over months
  const chartPoints = Array.from({ length: months + 1 }, (_, i) => {
    return Math.round(amount * Math.pow(1 + yearlyReturn, i / 12));
  });
  const maxVal = Math.max(...chartPoints, amount);
  const minVal = amount;
  const chartW = width - 64;
  const chartH = 110;

  const getChartXY = () => {
    return chartPoints.map((v, i) => {
      const x = (i / Math.max(months, 1)) * chartW;
      const y = chartH - 12 - ((v - minVal) / Math.max(maxVal - minVal, 1)) * (chartH - 24);
      return `${x},${y}`;
    }).join(' ');
  };

  const handleInvest = () => {
    setInvested(invested + amount);
    setShowModal(true);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.headerTitle}>Mock Investment Practice</Text>
        <Text style={s.wallet}>💰 ₹{invested}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>Total Invested</Text>
          <Text style={s.balanceAmt}>₹{invested.toLocaleString('en-IN')}</Text>
          <Text style={s.balanceSub}>+ ₹{Math.round(invested * 0.12)} expected profit • Keep going! 🔥</Text>
          <View style={s.barBg}><View style={[s.barFill, { width: `${Math.min(invested / 100, 100)}%` }]} /></View>
          <Text style={s.barText}>Goal: ₹10,000 • {Math.round(invested / 100)}% done</Text>
          <Text style={s.balanceDetail}>This is practice money. You are learning how investing works before using real money.</Text>
        </View>

        {/* Choose Option */}
        <Text style={s.sectionTitle}>Where Will You Invest?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
          {OPTIONS.map((o) => (
            <TouchableOpacity key={o.id} onPress={() => setSelected(o)} style={[s.optCard, { backgroundColor: selected.id === o.id ? o.color : '#1E1B4B', borderColor: selected.id === o.id ? '#fff' : 'transparent' }]}>
              <Text style={{ fontSize: 32 }}>{o.emoji}</Text>
              <Text style={[s.optName, { color: selected.id === o.id ? '#0F0E2E' : '#fff' }]}>{o.name}</Text>
              <Text style={[s.optRisk, { color: selected.id === o.id ? '#0F0E2E' : '#A5B4FC' }]}>{o.risk} • {o.return}% / yr</Text>
              <Text style={[s.optDesc, { color: selected.id === o.id ? '#333' : '#A5B4FC' }]}>{o.desc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Detail Box */}
        <View style={s.detailBox}>
          <Text style={s.detailTitle}>{selected.emoji} {selected.name} - How it works</Text>
          <Text style={s.detailText}>{selected.detail}</Text>
          <View style={s.detailRow}>
            <View style={s.detailChip}><Text style={s.detailChipLabel}>Best For</Text><Text style={s.detailChipVal}>{selected.bestFor}</Text></View>
            <View style={s.detailChip}><Text style={s.detailChipLabel}>Risk</Text><Text style={s.detailChipVal}>{selected.risk}</Text></View>
            <View style={s.detailChip}><Text style={s.detailChipLabel}>Min Amount</Text><Text style={s.detailChipVal}>₹{selected.min}</Text></View>
          </View>
        </View>

        {/* Digital Gold Live Price */}
        {selected.id === 'gold' && (
          <View style={s.goldCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.goldTitle}>🪙 Digital Gold - 24 Carat Live Price</Text>
              <Text style={[s.liveDot, { color: goldUp ? '#22C55E' : '#FF6B6B' }]}>{goldUp ? '▲ Live' : '▼ Live'}</Text>
            </View>
            <Text style={s.goldPrice}>₹{goldPrice.toLocaleString('en-IN')} <Text style={{ fontSize: 14, color: '#A5B4FC' }}>/ 1 gram (24K)</Text></Text>
            <Text style={s.goldSub}>With ₹{amount}, you will get <Text style={{ color: '#FFD93D', fontWeight: '900' }}>{goldGrams} grams</Text> of gold today.</Text>
            <Text style={s.goldSub}>After {months} months, your gold could be worth ~₹{goldFutureGramsValue.toLocaleString('en-IN')}</Text>
            <Text style={s.goldNote}>Price updates every few seconds like the real market. This is for learning only.</Text>
          </View>
        )}

        {/* Interactive Calculator */}
        <View style={s.calcCard}>
          <Text style={s.calcTitle}>🧮 {selected.emoji} {selected.name} Calculator</Text>
          
          <Text style={s.label}>How Much Will You Invest? <Text style={s.labelBold}>₹{amount}</Text></Text>
          <Slider style={{ width: '100%', height: 40 }} minimumValue={100} maximumValue={5000} step={100} value={amount} onValueChange={setAmount} minimumTrackTintColor="#FFD93D" maximumTrackTintColor="#333" thumbTintColor="#FFD93D" />

          <Text style={s.label}>For How Many Months? <Text style={s.labelBold}>{months} Months</Text></Text>
          <View style={s.monthRow}>
            {[6, 12, 24, 36].map(m => (
              <TouchableOpacity key={m} onPress={() => setMonths(m)} style={[s.monthBtn, months === m && s.monthActive]}>
                <Text style={[s.monthText, months === m && { color: '#0F0E2E' }]}>{m}M</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Line Chart - Growth Graph */}
          <View style={s.chartBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.chartTitle}>📈 Your Growth Graph</Text>
              <Text style={s.chartReturn}>+{selected.return}% / year</Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <Svg width={chartW} height={chartH + 18}>
                <Line x1={0} y1={chartH - 12} x2={chartW} y2={chartH - 12} stroke="#333" strokeWidth={1} strokeDasharray="4 4" />
                <Polyline points={getChartXY()} fill="none" stroke={selected.color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
                <Circle cx={chartW} cy={chartH - 12 - ((expected - minVal) / Math.max(maxVal - minVal, 1)) * (chartH - 24)} r={6} fill={selected.color} stroke="#fff" strokeWidth={2} />
                <Circle cx={0} cy={chartH - 12} r={4} fill="#fff" />
                <SvgText x={0} y={chartH + 12} fill="#A5B4FC" fontSize={10} fontWeight="700">Now</SvgText>
                <SvgText x={chartW - 28} y={chartH + 12} fill="#A5B4FC" fontSize={10} fontWeight="700">{months}M</SvgText>
                <SvgText x={chartW - 55} y={chartH - 12 - ((expected - minVal) / Math.max(maxVal - minVal, 1)) * (chartH - 24) - 10} fill="#22C55E" fontSize={11} fontWeight="900">₹{expected}</SvgText>
              </Svg>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={s.chartLabel}>Start: ₹{amount}</Text>
              <Text style={s.chartLabel}>End: ₹{expected} • Profit +₹{profit}</Text>
            </View>
          </View>

          <View style={s.resultBox}>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.resultLabel}>You Invest</Text>
              <Text style={s.resultVal}>₹{amount}</Text>
            </View>
            <Text style={{ fontSize: 22 }}>→</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.resultLabel}>You Get</Text>
              <Text style={[s.resultVal, { color: '#22C55E' }]}>₹{expected}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.resultLabel}>Profit</Text>
              <Text style={[s.resultVal, { color: '#FFD93D' }]}>+₹{profit}</Text>
            </View>
          </View>

          {selected.id === 'gold' && (
            <Text style={s.goldCalcLine}>🪙 You will own {goldGrams} grams of 24K Gold with ₹{amount}</Text>
          )}

          <TouchableOpacity style={s.investBtn} onPress={handleInvest}>
            <Text style={s.investBtnText}>Invest ₹{amount} Now →</Text>
          </TouchableOpacity>
          <Text style={s.note}>*Demo Mode - No real money will be deducted</Text>
        </View>

        {/* Learn Tip */}
        <View style={s.tipBox}>
          <Text style={s.tipTitle}>💡 Pro Tip</Text>
          <Text style={s.tipText}>Investing a small amount every month is more powerful than investing a big amount only once. This is called SIP. Your money grows because profit also starts earning profit. This is called compounding.</Text>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={s.nav}>
        <TouchableOpacity onPress={() => router.push('/teen-dashboard' as any)}><Text style={s.navText}>🏠 Home</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/piggy_bank' as any)}><Text style={s.navText}>🐷 Piggy</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/league' as any)}><Text style={s.navText}>🏆 League</Text></TouchableOpacity>
        <TouchableOpacity><Text style={[s.navText, { color: '#FFD93D' }]}>📈 Invest</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile' as any)}><Text style={s.navText}>👤 Profile</Text></TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={s.modalBg} onPress={() => setShowModal(false)}>
          <View style={s.modalCard}>
            <Text style={{ fontSize: 60 }}>🎉</Text>
            <Text style={s.modalTitle}>Invested!</Text>
            <Text style={s.modalSub}>You invested ₹{amount} in {selected.name}.{'\n'}After {months} months you may get ~₹{expected}!</Text>
            {selected.id === 'gold' && <Text style={s.modalSub}>You now own {goldGrams} grams of 24K Digital Gold.</Text>}
            <Text style={s.modalXp}>+20 XP earned! 🔥</Text>
            <TouchableOpacity style={s.modalBtn} onPress={() => setShowModal(false)}><Text style={{ color: '#fff', fontWeight: '900' }}>Awesome!</Text></TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0E2E' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  back: { color: '#fff', fontSize: 32, fontWeight: '900' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900', flex: 1, textAlign: 'center' },
  wallet: { color: '#FFD93D', fontWeight: '900', fontSize: 14 },
  balanceCard: { backgroundColor: '#FFD93D', margin: 16, borderRadius: 20, padding: 16 },
  balanceLabel: { fontSize: 12, fontWeight: '700', color: '#555' },
  balanceAmt: { fontSize: 44, fontWeight: '900', color: '#0F0E2E' },
  balanceSub: { fontSize: 12, color: '#333', marginTop: 4, fontWeight: '600' },
  barBg: { height: 8, backgroundColor: '#fff', borderRadius: 10, marginTop: 12, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: '#22C55E', borderRadius: 10 },
  barText: { fontSize: 11, color: '#333', marginTop: 6, fontWeight: '700' },
  balanceDetail: { fontSize: 11, color: '#555', marginTop: 8, lineHeight: 16, fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginLeft: 16, marginBottom: 10 },
  optCard: { width: 150, borderRadius: 18, padding: 14, marginRight: 12, borderWidth: 2 },
  optName: { fontWeight: '900', fontSize: 15, marginTop: 8 },
  optRisk: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  optDesc: { fontSize: 11, marginTop: 4 },
  detailBox: { backgroundColor: '#1E1B4B', marginHorizontal: 16, marginTop: 4, marginBottom: 12, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#333' },
  detailTitle: { color: '#fff', fontWeight: '900', fontSize: 14 },
  detailText: { color: '#A5B4FC', fontSize: 12, marginTop: 6, lineHeight: 17 },
  detailRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  detailChip: { flex: 1, backgroundColor: '#0F0E2E', borderRadius: 10, padding: 8 },
  detailChipLabel: { color: '#A5B4FC', fontSize: 9, fontWeight: '700' },
  detailChipVal: { color: '#fff', fontSize: 11, fontWeight: '900', marginTop: 2 },
  goldCard: { backgroundColor: '#1E1B4B', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#FFD93D' },
  goldTitle: { color: '#fff', fontWeight: '900', fontSize: 13, flex: 1 },
  liveDot: { fontWeight: '900', fontSize: 11 },
  goldPrice: { color: '#FFD93D', fontWeight: '900', fontSize: 24, marginTop: 8 },
  goldSub: { color: '#fff', fontSize: 12, marginTop: 6, lineHeight: 17 },
  goldNote: { color: '#A5B4FC', fontSize: 10, marginTop: 8 },
  calcCard: { backgroundColor: '#1E1B4B', margin: 16, borderRadius: 20, padding: 16 },
  calcTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 14 },
  label: { color: '#A5B4FC', fontSize: 13, marginTop: 8 },
  labelBold: { color: '#fff', fontWeight: '900', fontSize: 15 },
  monthRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  monthBtn: { backgroundColor: '#0F0E2E', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  monthActive: { backgroundColor: '#FFD93D', borderColor: '#FFD93D' },
  monthText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  chartBox: { backgroundColor: '#0F0E2E', borderRadius: 14, padding: 12, marginTop: 16 },
  chartTitle: { color: '#fff', fontWeight: '900', fontSize: 13 },
  chartReturn: { color: '#22C55E', fontWeight: '900', fontSize: 12 },
  chartLabel: { color: '#A5B4FC', fontSize: 10, fontWeight: '700' },
  resultBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F0E2E', borderRadius: 14, padding: 14, marginTop: 16 },
  resultLabel: { color: '#A5B4FC', fontSize: 10 },
  resultVal: { color: '#fff', fontWeight: '900', fontSize: 15, marginTop: 2 },
  goldCalcLine: { color: '#FFD93D', fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  investBtn: { backgroundColor: '#FFD93D', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  investBtnText: { color: '#0F0E2E', fontWeight: '900', fontSize: 16 },
  note: { color: '#666', fontSize: 10, textAlign: 'center', marginTop: 8 },
  tipBox: { backgroundColor: '#312E81', marginHorizontal: 16, borderRadius: 16, padding: 14 },
  tipTitle: { color: '#FFD93D', fontWeight: '900', fontSize: 14 },
  tipText: { color: '#fff', fontSize: 12, marginTop: 4, lineHeight: 18 },
  nav: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1E1B4B', paddingVertical: 14, paddingBottom: 22 },
  navText: { color: '#A5B4FC', fontWeight: '700', fontSize: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: '#fff', width: width * 0.85, borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', marginTop: 8 },
  modalSub: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 6, lineHeight: 19 },
  modalXp: { color: '#22C55E', fontWeight: '900', marginTop: 10 },
  modalBtn: { backgroundColor: '#0F0E2E', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
});