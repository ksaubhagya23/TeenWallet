// app/lessons.tsx - TeenWallet Lessons - connected to the live backend (lessons, quizzes, AI tutor)
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api, ApiError, clearSession, errorText } from '../lib/api';

// COLORS - LOCKED BLUE COMBO
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

type LessonRow = { id: string; title: string; topic: string | null; completed: boolean; quizScore: number | null };
type Question = { index: number; q: string; options: string[] };
type Detail = { id: string; title: string; topic: string | null; body: string; questions: Question[] };
type Graded = { score: number; total: number; percent: number; passed: boolean; results: { index: number; correct: boolean; correctIndex: number; explain: string | null }[]; newBadges: string[] };

const ICONS: Record<string, string> = { saving: '🐷', budget: '📝', scam: '🛡️', invest: '📈', money: '💰' };
const iconFor = (l: LessonRow) => {
  const t = `${l.topic || ''} ${l.title}`.toLowerCase();
  const k = Object.keys(ICONS).find(x => t.includes(x));
  return k ? ICONS[k] : '📘';
};

export default function Lessons() {
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [opening, setOpening] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // AI tutor
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [reply, setReply] = useState<{ answer: string; source: string; model?: string } | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const r = await api('/lessons');
      setLessons(r.lessons || []);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { await clearSession(); router.replace('/'); return; }
      setLoadError(errorText(e));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(lessons.map(l => l.topic).filter(Boolean) as string[]))], [lessons]);

  const filtered = useMemo(() => {
    let list = lessons;
    if (cat !== 'All') list = list.filter(l => l.topic === cat);
    if (search) list = list.filter(l => `${l.title} ${l.topic || ''}`.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [lessons, search, cat]);

  const doneCount = lessons.filter(l => l.completed).length;
  const recommended = lessons.find(l => !l.completed) || lessons[0];

  const openLesson = async (id: string) => {
    setOpening(true);
    try {
      const d: Detail = await api(`/lessons/${id}`);
      setDetail(d); setAnswers(d.questions.map(() => null)); setGraded(null);
    } catch (e) { Alert.alert('Could not open lesson', errorText(e)); }
    finally { setOpening(false); }
  };

  const closeLesson = () => { setDetail(null); setAnswers([]); setGraded(null); };

  const submitQuiz = async () => {
    if (!detail) return;
    if (answers.some(a => a === null)) { Alert.alert('Answer every question first'); return; }
    setSubmitting(true);
    try {
      const g: Graded = await api(`/lessons/${detail.id}/quiz`, { method: 'POST', body: { answers } });
      setGraded(g);
      if (g.passed) load();
    } catch (e) { Alert.alert('Could not submit', errorText(e)); }
    finally { setSubmitting(false); }
  };

  const askTutor = async () => {
    const q = question.trim();
    if (q.length < 3) return;
    setAsking(true); setReply(null);
    try {
      const r = await api('/ai/ask', { method: 'POST', body: { question: q }, timeoutMs: 90000 });
      setReply({ answer: r.answer, source: r.source, model: r.model });
    } catch (e) { Alert.alert('The tutor could not answer', errorText(e)); }
    finally { setAsking(false); }
  };

  if (loading) {
    return <View style={[s.container, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator size="large" color={C.blue} /><Text style={{ color: C.grey, marginTop: 10 }}>Loading lessons...</Text></View>;
  }

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.headerTitle}>Lessons</Text>
        <View style={s.headerRight}>
          <View style={s.xpPill}><Text style={s.xpText}>✅ {doneCount}/{lessons.length}</Text></View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* MONEY TUTOR - AI answers from the lessons */}
        <View style={s.aiCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 26 }}>🤖</Text>
            <Text style={s.aiTitle}>Ask the Money Tutor</Text>
          </View>
          <Text style={s.aiSub}>Ask anything about saving, budgeting or scams.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TextInput placeholder="e.g. How do I save for a phone?" value={question} onChangeText={setQuestion} style={s.aiInput} placeholderTextColor="#7A8BB0" editable={!asking} onSubmitEditing={askTutor} returnKeyType="send" />
            <TouchableOpacity style={[s.askBtn, asking && { opacity: 0.6 }]} onPress={askTutor} disabled={asking}>
              {asking ? <ActivityIndicator color={C.text} /> : <Text style={{ fontWeight: '900', color: C.text }}>Ask</Text>}
            </TouchableOpacity>
          </View>
          {reply && (
            <View style={s.answerBox}>
              <Text style={s.answerText}>{reply.answer}</Text>
              <Text style={s.answerMeta}>{reply.source === 'ai' ? `AI answer${reply.model ? ' • ' + reply.model : ''}` : 'From the lessons'}</Text>
            </View>
          )}
        </View>

        {loadError ? (
          <View style={[s.lessonCard, { flexDirection: 'column', alignItems: 'flex-start' }]}>
            <Text style={s.lessonTitle}>Could not load lessons</Text>
            <Text style={s.lessonDesc}>{loadError}</Text>
            <TouchableOpacity style={[s.aiBtn, { marginTop: 10 }]} onPress={() => { setLoading(true); load(); }}><Text style={s.aiBtnText}>Try again</Text></TouchableOpacity>
          </View>
        ) : (<>
        <View style={s.searchInside2}>
          <Text>🔍</Text>
          <TextInput placeholder="Search lessons..." value={search} onChangeText={setSearch} style={s.searchInput} placeholderTextColor="#7A8BB0" />
        </View>

        {recommended && (
          <TouchableOpacity style={[s.lessonCard, { borderWidth: 2, borderColor: C.gold }]} onPress={() => openLesson(recommended.id)}>
            <View style={[s.iconBox, { backgroundColor: C.lightBlue }]}><Text style={{ fontSize: 24 }}>⭐</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.lessonTitle}>Up next: {recommended.title}</Text>
              <Text style={s.lessonDesc}>Tap to start</Text>
            </View>
          </TouchableOpacity>
        )}

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
          <TouchableOpacity key={l.id} style={s.lessonCard} onPress={() => openLesson(l.id)} disabled={opening}>
            <View style={[s.iconBox, { backgroundColor: C.lightBlue }]}>
              <Text style={{ fontSize: 24 }}>{iconFor(l)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.lessonTitle}>{l.title} {l.completed ? '✅' : ''}</Text>
              <Text style={s.lessonSub}>{l.topic || 'Money'}{l.quizScore !== null && l.quizScore !== undefined ? ` • best score ${l.quizScore}` : ''}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && <Text style={[s.lessonDesc, { marginHorizontal: 16, marginTop: 14 }]}>No lessons found.</Text>}
        </>)}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* LESSON DETAIL + QUIZ MODAL */}
      <Modal visible={!!detail} animationType="slide" transparent onRequestClose={closeLesson}>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.modalTitle}>{detail?.title}</Text>
              <TouchableOpacity onPress={closeLesson}><Text style={{ fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={s.modalSub}>{detail?.topic || 'Money'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.lessonBody}>{detail?.body}</Text>

              {detail && detail.questions.length > 0 && <Text style={s.quizTitle}>Quick Quiz</Text>}
              {detail?.questions.map((q, qi) => (
                <View key={q.index} style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: '800', color: C.text }}>{qi + 1}. {q.q}</Text>
                  {q.options.map((opt, oi) => {
                    const r = graded?.results[qi];
                    const isChosen = answers[qi] === oi;
                    const bg = r ? (oi === r.correctIndex ? '#DFF5E8' : isChosen ? '#FDE2E1' : undefined) : undefined;
                    return (
                      <TouchableOpacity key={oi} disabled={!!graded} onPress={() => setAnswers(a => a.map((x, i) => (i === qi ? oi : x)))} style={[s.quizOpt, isChosen && !graded && s.quizOptActive, bg ? { backgroundColor: bg } : null]}>
                        <Text style={[s.quizOptText, isChosen && !graded && { color: '#fff' }]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {graded?.results[qi]?.explain ? <Text style={s.explain}>{graded.results[qi].explain}</Text> : null}
                </View>
              ))}

              {graded && (
                <Text style={graded.passed ? s.correct : s.wrong}>
                  {graded.passed ? `Passed! ${graded.score}/${graded.total} 🎉` : `${graded.score}/${graded.total} - you need 60% to pass. Close and try again.`}
                  {graded.newBadges.length ? `  New badge: ${graded.newBadges.join(', ')}` : ''}
                </Text>
              )}

              {!graded ? (
                <TouchableOpacity disabled={submitting} style={[s.completeBtn, submitting && { opacity: 0.5 }]} onPress={submitQuiz}>
                  <Text style={{ color: '#fff', fontWeight: '900' }}>{submitting ? 'Checking...' : 'Submit Quiz'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.completeBtn} onPress={closeLesson}><Text style={{ color: '#fff', fontWeight: '900' }}>Done</Text></TouchableOpacity>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
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

  aiInput: { flex: 1, backgroundColor: '#EAF1FF', borderRadius: 12, paddingHorizontal: 12, height: 44, color: C.text, fontSize: 13 },
  askBtn: { backgroundColor: C.gold, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 44 },
  answerBox: { backgroundColor: '#EAF1FF', borderRadius: 12, padding: 12, marginTop: 10 },
  answerText: { color: C.text, fontSize: 13, lineHeight: 19 },
  answerMeta: { color: C.grey, fontSize: 10, marginTop: 6 },
  searchInside2: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, height: 44, marginHorizontal: 16, marginTop: 14 },
  explain: { color: C.grey, fontSize: 12, marginTop: 4 },
});
