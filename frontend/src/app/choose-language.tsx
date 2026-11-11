import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WarliBackground from "../components/WarliBackground";

type Lang = 'english' | 'hindi' | 'french' | 'spanish' | 'tamil';

const LANGUAGES: { id: Lang; title: string; sub: string }[] = [
  { id: 'english', title: 'English', sub: 'Continue in English' },
  { id: 'hindi', title: 'हिन्दी', sub: 'हिन्दी में आगे बढ़ें' },
  { id: 'french', title: 'Français', sub: 'Continuer en français' },
  { id: 'spanish', title: 'Español', sub: 'Continuar en español' },
  { id: 'tamil', title: 'தமிழ்', sub: 'தமிழில் தொடரவும்' },
];

export default function ChooseLanguage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Lang | null>(null);
  const [hovered, setHovered] = useState<Lang | null>(null);

  const scales = useRef({
    english: new Animated.Value(1),
    hindi: new Animated.Value(1),
    french: new Animated.Value(1),
    spanish: new Animated.Value(1),
    tamil: new Animated.Value(1),
  }).current;

  const pressIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const pressOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  const goNext = () => {
    if (!selected) return;
    router.push({ pathname: '/choose-role', params: { lang: selected } });
  };

  return (
    <View style={styles.container}>
      <WarliBackground />
      <Text style={styles.logo}>Rupee Ranger</Text>
      <Text style={styles.tag}>SAVE SMART • SPEND SMART</Text>

      <Text style={styles.heading}>Select Your Preferred Language</Text>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {LANGUAGES.map((item) => {
          const isActive = selected === item.id || hovered === item.id;
          const anim = scales[item.id];
          return (
            <Animated.View key={item.id} style={{ transform: [{ scale: anim }] }}>
              <Pressable
                onPress={() => setSelected(item.id)}
                onPressIn={() => pressIn(anim)}
                onPressOut={() => pressOut(anim)}
                onHoverIn={() => setHovered(item.id)}
                onHoverOut={() => setHovered(null)}
                style={[styles.card, isActive && styles.cardActive]}
              >
                <View style={styles.cardCenter}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSub}>{item.sub}</Text>
                </View>

                {selected === item.id && (
                  <View style={styles.tickBox}>
                    <Text style={styles.tick}>✓</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.btn, !selected && styles.btnDisabled]}
        onPress={goNext}
        disabled={!selected}
      >
        <Text style={styles.btnText}>Continue →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A235A', padding: 25, paddingTop: 60 },
  logo: { fontFamily: 'Samarkan', fontSize: 42, color: '#FFEFC2', textAlign: 'center' },
  tag: { color: '#FFB627', fontSize: 11, letterSpacing: 3, textAlign: 'center', marginTop: 4, marginBottom: 25 },
  heading: {
    fontFamily: 'Samarkan',
    fontSize: 32,
    color: '#FFEFC2',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 22,
  },
  list: { flex: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    paddingHorizontal: 20,
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 78,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardActive: {
    borderColor: '#FFB627',
    backgroundColor: '#FFFEF0',
    shadowColor: '#FFB627',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  cardCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: 'NunitoSans-Bold', fontSize: 26, color: '#0A235A', textAlign: 'center' },
  cardSub: { fontFamily: 'NunitoSans-Regular', fontSize: 13, color: '#666', marginTop: 2, textAlign: 'center' },
  tickBox: {
    backgroundColor: '#FFB627',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
  },
  tick: { fontSize: 16, color: '#0A235A', fontWeight: 'bold' },
  btn: { backgroundColor: '#FFB627', borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 12 },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: 'NunitoSans-Bold', fontSize: 18, color: '#0A235A' },
});