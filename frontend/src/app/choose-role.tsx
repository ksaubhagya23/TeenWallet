import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import WarliBackground from "../components/WarliBackground";

type Role = 'teen' | 'parent';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning!';
  if (hour >= 12 && hour < 17) return 'Good Afternoon!';
  if (hour >= 17 && hour < 21) return 'Good Evening!';
  return 'Welcome\nHome!';
}

export default function ChooseRole() {
  const router = useRouter();
  const { lang } = useLocalSearchParams();
  const [selected, setSelected] = useState<Role | null>(null);
  const [hovered, setHovered] = useState<Role | null>(null);

  const scaleParent = useRef(new Animated.Value(1)).current;
  const scaleTeen = useRef(new Animated.Value(1)).current;

  const pressIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const pressOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  };

  const goNext = (role: Role) => {
    setSelected(role);
    setTimeout(() => {
      if (role === 'teen') router.push({ pathname: '/login-teen', params: { lang } });
      else router.push({ pathname: '/login-parent', params: { lang } });
    }, 150);
  };

  const renderBox = (role: Role, label: string, anim: Animated.Value) => {
    const isActive = selected === role || hovered === role;
    return (
      <Animated.View style={{ transform: [{ scale: anim }], width: '100%' }}>
        <Pressable
          onPress={() => goNext(role)}
          onPressIn={() => pressIn(anim)}
          onPressOut={() => pressOut(anim)}
          onHoverIn={() => setHovered(role)}
          onHoverOut={() => setHovered(null)}
          style={[styles.box, isActive && styles.boxActive]}
        >
          <Text style={styles.boxText}>{label}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <WarliBackground />
      <Text style={styles.greeting}>{getGreeting()}</Text>
      <Text style={styles.areYou}>Are You a</Text>
      {renderBox('parent', 'Parent', scaleParent)}
      <Text style={styles.or}>or</Text>
      {renderBox('teen', 'Teen', scaleTeen)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position : 'relative',
    backgroundColor: '#0A235A',
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 48,
    lineHeight: 54,
    color: '#FFEFC2',
    textAlign: 'center',
    marginBottom: 28,
  },
  areYou: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 26,
    color: '#FFEFC2',
    textAlign: 'center',
    marginBottom: 16,
  },
  or: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 26,
    color: '#FFEFC2',
    textAlign: 'center',
    marginVertical: 16,
  },
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  boxActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFB627',
    shadowColor: '#FFB627',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  boxText: {
    fontFamily: 'NunitoSans-Bold',
    fontSize: 42,
    color: '#0A235A',
    textAlign: 'center',
    lineHeight: 48,
  },
});