// app/lessons.tsx - TeenWallet Lessons - BLUE THEME LOCKED
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// COLORS - LOCKED BLUE COMBO - kabhi change mat karna
const C = {
  bg: '#F0F6FF',
  deep: '#1E3A8A',
  blue: '#2563EB',
  lightBlue: '#DCE8FF',
  gold: '#FFC93C',
  white: '#FFFFFF',
  text: '#0F1E3D',
  grey: '#6B7A90',
  border: '#DCE8FF',
  green: '#00A651',
  red: '#E53935',
};

type Lesson = {
  id: string;
  title: string;
  category: string;
  xp: number;
  duration: string;
  desc: string;
  icon: string;
  locked: boolean;
  done: boolean;
};

// MOCK DATA - Baad me backend se aayega
const MOCK_LESSONS: Lesson[] = [
  { id: '1', title: 'What is Money?', category: 'Money Basics', xp: 20, duration: '5 min', desc: 'Learn the basics of money & why it matters', icon: '💰', locked: false, done: true },
  { id: '2', title: 'Saving Smarter', category: 'Saving', xp: 15, duration: '6 min', desc: 'How to save money each week', icon: '🐷', locked: false, done: false },
  { id: '3', title: 'Reading Charts', category: 'Money Basics', xp: 20, duration: '4 min', desc: 'Understand spending charts & trends', icon: '📊', locked: true, done: false },
  { id: '4', title: 'Building a Budget', category: 'Budgeting', xp: 25, duration: '7 min', desc: 'Create your first simple budget', icon: '📝', locked: true, done: false },
  { id: '5', title: 'Scam Safety', category: 'Scam Safety', xp: 30, duration: '5 min', desc: 'How to spot fake links & scams', icon: '🛡️', locked: true, done: false },
  { id: '6', title: 'Investing Basics', category: 'Investing', xp: 30, duration: '8 min', desc: 'What is investing for teens?', icon: '📈', locked: true, done: false },
];

export default function Lessons() {
  const router = useRouter();
  const [lessons, setLessons] = useState(MOCK_LESSONS);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [quizAns, setQuizAns] = useState<number | null>(null);

  // Elastic Search - abhi local filter, baad me /api/elastic/search?q=
  const filtered = useMemo(() => {
    let list = lessons;
    if (cat !== 'All') list = list.filter(l => l.category === cat);
    if (search) list = list.filter(l => (l.title + l.category).toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [lessons, search, cat]);

  const totalXP = lessons.filter(l => l.done).reduce((s, l) => s + l.xp, 0);
  const doneCount = lessons.filter(l => l.done).length;

  const completeLesson = (id: string) => {
    setLessons(prev => prev.map(l => {
      if (l.id === id) return { ...l, done: true };
      // Next lesson unlock
      const idx = prev.findIndex(x => x.id === id);
      if (prev.indexOf(l) === idx + 1) return { ...l, locked: false };
      return l;
    }));
    setSelected(null);
    setQuizAns(null);
  };

  const categories = ['All', 'Money Basics', 'Saving', 'Budgeting', 'Scam Safety', 'Investing'];
  const recommended = lessons.find(l => !l.done && !l.locked) || lessons[0];

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.headerTitle}>Lessons</Text>
        <View style={s.headerRight}>
          <View style={s.streakPill}><Text style={s.streakText}>🔥 5 days</Text></View>
          <View style={s.xpPill}><Text style={s.xpText}>⭐ {totalXP} XP</Text></View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AI FOR YOU - Astropod */}
        <View style={s.aiCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 26 }}>🤖</Text>
            <Text style={s.aiTitle}>AI For You</Text>
          </View>
          <Text style={s.aiSub}>Daily lesson picked for you — {recommended.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={s.aiSmall}>{recommended.category} • {recommended.duration} • +{recommended.xp} XP</Text>
            <TouchableOpacity style={s.aiBtn} onPress={() => setSelected(recommended)}>
              <Text style={s.aiBtnText}>Start Now</Text>
            </TouchableOpacity>
          </View>
          <View style={s.searchInside}>
            <Text>🔍</Text>
            <TextInput placeholder="Search lessons..." value={search} onChangeText={setSearch} style={s.searchInput} placeholderTextColor="#7A8BB0" />
          </View>
        </View>

        {/* CATEGORY CHIPS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          {categories.map(c => (
            <TouchableOpacity key={c} onPress={() => setCat(c)} style={[s.chip, cat === c ? s.chipActive : s.chipInactive]}>
              <Text style={[s.chipText, cat === c ? { color: '#fff' } : { color: C.deep }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.sectionTitle}>Lessons • {doneCount}/{lessons.length} Done</Text>

        {/* LESSON LIST */}
        {filtered.map(l => (
          <TouchableOpacity key={l.id} style={[s.lessonCard, l.locked && { opacity: 0.7 }]} onPress={() => !l.locked && setSelected(l)}>
            <View style={[s.iconBox, { backgroundColor: l.locked ? '#E5EAF3' : C.lightBlue }]}>
              <Text style={{ fontSize: 24 }}>{l.locked ? '🔒' : l.icon}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.lessonTitle}>{l.title} {l.done ? '✅' : ''}</Text>
              <Text style={s.lessonSub}>{l.category} • {l.duration} {l.locked ? '• Locked' : ''}</Text>
              <Text style={s.lessonDesc}>{l.desc}</Text>
            </View>
            <View style={[s.xpBadge, { backgroundColor: l.locked ? '#FFF3CD' : C.gold }]}>
              <Text style={s.xpBadgeText}>{l.locked ? `🔒 ${l.xp} XP` : `⭐ ${l.xp} XP`}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* LESSON DETAIL + QUIZ MODAL */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.modalTitle}>{selected?.title}</Text>
              <TouchableOpacity onPress={() => { setSelected(null); setQuizAns(null); }}><Text style={{ fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={s.modalSub}>{selected?.category} • {selected?.duration} • AI Generated by Astropod</Text>
            <Text style={s.lessonBody}>
              {selected?.category === 'Saving'
                ? 'If you save ₹50 every week, in 10 weeks you will have ₹500. Small savings become big money. Always save first, then spend.'
                : 'Money is a tool. Learn to save, spend smartly and stay safe from scams. Complete this lesson to earn XP and unlock next level.'}
            </Text>

            <Text style={s.quizTitle}>Quick Quiz - What is the best habit?</Text>
            {['Save first, then spend', 'Spend all, then save', 'Never save'].map((opt, i) => (
              <TouchableOpacity key={opt} onPress={() => setQuizAns(i)} style={[s.quizOpt, quizAns === i && s.quizOptActive]}>
                <Text style={[s.quizOptText, quizAns === i && { color: '#fff' }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
            {quizAns === 0 && <Text style={s.correct}>Correct! +{selected?.xp} XP earned 🎉</Text>}
            {quizAns !== null && quizAns !== 0 && <Text style={s.wrong}>Not quite. Try again - Hint: Save first!</Text>}

            <TouchableOpacity disabled={quizAns !== 0} style={[s.completeBtn, quizAns !== 0 && { opacity: 0.5 }]} onPress={() => selected && completeLesson(selected.id)}>
              <Text style={{ color: '#fff', fontWeight: '900' }}>Complete Lesson</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.deep },
  back: { fontSize: 26, fontWeight: '900', color: '#fff' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerRight: { flexDirection: 'row', gap: 6 },
  streakPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  streakText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  xpPill: { backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  xpText: { color: C.text, fontWeight: '900', fontSize: 11 },
  aiCard: { backgroundColor: C.deep, marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 16 },
  aiTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  aiSub: { color: '#DCE8FF', fontSize: 13, marginTop: 4 },
  aiSmall: { color: '#DCE8FF', fontSize: 11, flex: 1 },
  aiBtn: { backgroundColor: C.blue, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  aiBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  searchInside: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAF1FF', borderRadius: 12, paddingHorizontal: 12, height: 44, marginTop: 14 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, color: C.text },
  chipScroll: { paddingHorizontal: 16, marginTop: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: C.blue },
  chipInactive: { backgroundColor: C.lightBlue },
  chipText: { fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: 17, fontWeight: '900', color: C.text, marginHorizontal: 16, marginTop: 16 },
  lessonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, borderRadius: 16, padding: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  iconBox: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  lessonTitle: { fontSize: 14, fontWeight: '900', color: C.text },
  lessonSub: { fontSize: 11, color: C.grey, marginTop: 2 },
  lessonDesc: { fontSize: 12, color: C.grey, marginTop: 2 },
  xpBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  xpBadgeText: { fontSize: 11, fontWeight: '900', color: C.text },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: C.text, flex: 1 },
  modalSub: { fontSize: 11, color: C.grey, marginTop: 4 },
  lessonBody: { fontSize: 14, color: '#333', lineHeight: 20, marginTop: 14 },
  quizTitle: { fontWeight: '900', marginTop: 16, color: C.deep },
  quizOpt: { borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 12, marginTop: 8 },
  quizOptActive: { backgroundColor: C.blue, borderColor: C.blue },
  quizOptText: { fontSize: 13, fontWeight: '700', color: C.text },
  correct: { color: C.green, fontWeight: '800', marginTop: 10 },
  wrong: { color: C.red, fontWeight: '800', marginTop: 10 },
  completeBtn: { backgroundColor: C.deep, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
});