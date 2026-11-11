import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();
  const fontSize = Platform.OS === 'web' ? 72 : 46;
  const fullText = 'RupeeRanger';
  const [mintIndex, setMintIndex] = useState(-1);
  const [showSubtitle, setShowSubtitle] = useState(false);

  useEffect(() => {
    const subTimer = setTimeout(() => setShowSubtitle(true), 1400);
    const mintStart = setTimeout(() => {
      let i = -1;
      const mintTimer = setInterval(() => {
        i++;
        if (i <= fullText.length) setMintIndex(i);
        else if (i === fullText.length + 5) { setMintIndex(-1); clearInterval(mintTimer); }
      }, 180);
    }, 2100);

    // YE MISSING THA - 4 sec baad aage jayega
    const goNext = setTimeout(() => router.replace('/choose-language'), 4000);

    return () => { clearTimeout(subTimer); clearTimeout(mintStart); clearTimeout(goNext); };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        {fullText.split('').map((letter, index) => (
          <Text key={index} style={[styles.title, { fontSize }, { fontFamily: 'Samarkan' }, { color: index <= mintIndex ? '#2FE8A8' : '#FFEFC2' }]}>
            {letter}
          </Text>
        ))}
      </View>
      {showSubtitle && <Text style={styles.subtitle}>SAVE SMART • SPEND SMART</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A235A', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  textRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  title: { textShadowColor: 'rgba(255,239,194,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15, includeFontPadding: false },
  subtitle: { marginTop: 25, color: '#FFB627', fontSize: 12, letterSpacing: 3, textAlign: 'center' },
});