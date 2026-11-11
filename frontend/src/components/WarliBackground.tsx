import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Polygon, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const COLOR = "#E99A2B";

function useDance(delay: number, amount = 7) {
  const bounce = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const b = Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -amount, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]));
    const s = Animated.loop(Animated.sequence([
      Animated.timing(sway, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(sway, { toValue: -1, duration: 320, useNativeDriver: true }),
    ]));
    b.start(); s.start();
    return () => { b.stop(); s.stop(); };
  }, [bounce, sway, delay, amount]);
  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-9deg', '9deg'] });
  return { bounce, rotate };
}

function WarliDancer({ x, y, delay = 0, flip = false }: { x: number; y: number; delay?: number; flip?: boolean }) {
  const { bounce, rotate } = useDance(delay);
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, transform: [{ translateY: bounce }, { rotate }, { scaleX: flip ? -1 : 1 }] }}>
      <Svg width="36" height="58" viewBox="0 0 36 58">
        <Circle cx="18" cy="6" r="4.5" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Polygon points="18,11 7,26 29,26" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Polygon points="18,26 7,26 18,36 29,26" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Line x1="9" y1="18" x2="3" y2="4" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="27" y1="18" x2="33" y2="4" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="18" y1="36" x2="10" y2="52" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="18" y1="36" x2="26" y2="48" stroke={COLOR} strokeWidth="1.7" />
        <Circle cx="18" cy="26" r="1" fill={COLOR} />
      </Svg>
    </Animated.View>
  );
}

function WarliMatki({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  const { bounce, rotate } = useDance(delay, 4);
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, transform: [{ translateY: bounce }, { rotate }] }}>
      <Svg width="36" height="62" viewBox="0 0 36 62">
        <Ellipse cx="18" cy="3" rx="6" ry="3.5" stroke={COLOR} strokeWidth="1.6" fill="none" />
        <Circle cx="18" cy="9" r="4.5" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Polygon points="18,14 7,29 29,29" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Polygon points="18,29 7,29 18,39 29,29" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Line x1="9" y1="20" x2="14" y2="6" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="27" y1="20" x2="22" y2="6" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="18" y1="39" x2="11" y2="55" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="18" y1="39" x2="27" y2="53" stroke={COLOR} strokeWidth="1.7" />
      </Svg>
    </Animated.View>
  );
}

function WarliFarmer({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  const { bounce, rotate } = useDance(delay, 3);
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, transform: [{ translateY: bounce }, { rotate }] }}>
      <Svg width="40" height="58" viewBox="0 0 40 58">
        <Circle cx="18" cy="6" r="4.5" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Polygon points="18,11 7,26 29,26" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Polygon points="18,26 7,26 18,36 29,26" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Line x1="27" y1="18" x2="36" y2="26" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="9" y1="18" x2="3" y2="26" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="36" y1="26" x2="36" y2="54" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="18" y1="36" x2="10" y2="52" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="18" y1="36" x2="26" y2="52" stroke={COLOR} strokeWidth="1.7" />
      </Svg>
    </Animated.View>
  );
}

function WarliDrummer({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  const { bounce, rotate } = useDance(delay, 5);
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, transform: [{ translateY: bounce }, { rotate }] }}>
      <Svg width="46" height="58" viewBox="0 0 46 58">
        <Circle cx="16" cy="6" r="4.5" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Polygon points="16,11 5,26 27,26" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Polygon points="16,26 5,26 16,36 27,26" stroke={COLOR} strokeWidth="1.7" fill="none" />
        <Rect x="30" y="22" width="12" height="20" rx="4" stroke={COLOR} strokeWidth="1.6" fill="none" />
        <Line x1="30" y1="28" x2="42" y2="28" stroke={COLOR} strokeWidth="1" />
        <Line x1="30" y1="36" x2="42" y2="36" stroke={COLOR} strokeWidth="1" />
        <Line x1="25" y1="18" x2="32" y2="26" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="7" y1="18" x2="2" y2="26" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="16" y1="36" x2="9" y2="52" stroke={COLOR} strokeWidth="1.7" />
        <Line x1="16" y1="36" x2="24" y2="52" stroke={COLOR} strokeWidth="1.7" />
      </Svg>
    </Animated.View>
  );
}

export default function WarliBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      {/* TOP - Bilkul upar wali line */}
      <WarliDancer x={width * 0.06} y={16} delay={0} />
      <WarliMatki x={width * 0.28} y={14} delay={150} />
      <WarliDancer x={width * 0.60} y={16} delay={300} flip />
      <WarliMatki x={width * 0.82} y={14} delay={450} />

      {/* 👇 YE NAYI HAI - Welcome ke Left-Right wali - Circle wali jagah */}
      <WarliDancer x={width * 0.12} y={height * 0.13} delay={100} />
      <WarliMatki x={width * 0.78} y={height * 0.13} delay={350} />

      {/* MIDDLE - Side me */}
      <WarliFarmer x={8} y={height * 0.38} delay={100} />
      <WarliDrummer x={width - 54} y={height * 0.38} delay={250} />
      <WarliDrummer x={6} y={height * 0.55} delay={400} />
      <WarliFarmer x={width - 48} y={height * 0.55} delay={550} />

      {/* BOTTOM */}
      <WarliDrummer x={width * 0.06} y={height - 78} delay={0} />
      <WarliDancer x={width * 0.30} y={height - 76} delay={150} />
      <WarliMatki x={width * 0.52} y={height - 78} delay={300} />
      <WarliDancer x={width * 0.74} y={height - 76} delay={450} flip />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 0,
    opacity: 0.45,
  },
});