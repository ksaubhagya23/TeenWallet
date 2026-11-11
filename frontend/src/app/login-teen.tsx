import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import WarliBackground from "../components/WarliBackground";

// ===== YAHIN PE BACKEND KA LOGIC HAI, KOI NAYI FILE NAHI =====
const API_URL = 'http://192.168.1.5:5000/api'; // Wahi IP jo baaki files me daala tha

async function apiCall(endpoint: string, body: any) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    return { success: true, data, isDemo: false };
  } catch (e) {
    return { success: false, data: null, isDemo: true };
  }
}

export default function TeenLogin() {
  const router = useRouter();
  const { lang } = useLocalSearchParams();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!user || !password) {
      alert('Please enter Username / Email / Mobile and Password');
      return;
    }

    setLoading(true);
    const isEmail = user.includes('@');
    const isPhone = /^[0-9+]+$/.test(user.trim());
    const result = await apiCall('/auth/login', {
      email: isEmail ? user : undefined,
      phone: isPhone ? user : undefined,
      username: !isEmail && !isPhone ? user : undefined,
      password,
      role: 'teen',
    });
    setLoading(false);

    // 1. Real Backend - Login success
    if (!result.isDemo && result.data?.token) {
      await AsyncStorage.setItem('token', result.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(result.data.user || { name: user, role: 'teen' }));
      router.replace({ pathname: '/teen-dashboard', params: { lang } });
      return;
    }

    // 2. Demo Mode - Backend off hai
    if (result.isDemo) {
      await AsyncStorage.setItem('token', 'demo-token');
      await AsyncStorage.setItem('user', JSON.stringify({ name: user, role: 'teen', isDemo: true }));
      alert(`DEMO MODE: Backend is off\nLogin done!`);
      router.replace({ pathname: '/teen-dashboard', params: { lang } });
      return;
    }

    // 3. Real Backend ne mana kar diya
    alert(result.data?.message || 'Wrong Username / Email or Password');
  };

  return (
    <View style={styles.container}>
      <WarliBackground />
      <Text style={styles.heading}>Teen Login</Text>
      <Text style={styles.sub}>Your money, your control!</Text>

      <Text style={styles.label}>Username / Email / Mobile Number</Text>
      <TextInput
        style={[styles.input, focused === 'user' && styles.inputActive]}
        placeholder="Enter Username / Email / Mobile"
        value={user}
        onChangeText={setUser}
        autoCapitalize="none"
        keyboardType="email-address"
        onFocus={() => setFocused('user')}
        onBlur={() => setFocused(null)}
      />

      <Text style={styles.label}>Password</Text>
      <View style={[styles.passWrap, focused === 'pass' && styles.inputActive]}>
        <TextInput
          style={styles.passInput}
          placeholder="••••••••"
          secureTextEntry={!showPass}
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocused('pass')}
          onBlur={() => setFocused(null)}
        />
        <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
          <Text style={styles.eyeText}>{showPass ? '👁️' : '🙈'}</Text>
        </Pressable>
      </View>
      <Text style={styles.demoHint}>Enter anything for DEMO - Backend is off so login can be done</Text>

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#0A235A" /> : <Text style={styles.btnText}>Login</Text>}
      </TouchableOpacity>

      <View style={styles.signupRow}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <Pressable onPress={() => router.push({ pathname: '/signup-teen', params: { lang } })}>
          <Text style={styles.signupLink}>SignUp</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A235A', padding: 28, paddingTop: 90 },
  heading: { fontFamily: 'NunitoSans-Bold', fontSize: 48, color: '#FFEFC2' },
  sub: { fontFamily: 'NunitoSans-Regular', fontSize: 16, color: '#FFEFC2', marginTop: 6, marginBottom: 40 },
  label: { fontFamily: 'NunitoSans-Regular', fontSize: 16, color: '#FFFFFF', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, fontFamily: 'NunitoSans-Regular', fontSize: 16, borderWidth: 3, borderColor: 'transparent' },
  passWrap: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 3, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  passInput: { flex: 1, padding: 16, fontFamily: 'NunitoSans-Regular', fontSize: 16 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 20 },
  inputActive: { borderColor: '#FFB627' },
  demoHint: { fontFamily: 'NunitoSans-Regular', fontSize: 12, color: '#FFB627', marginTop: 10 },
  btn: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 28 },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontFamily: 'NunitoSans-Bold', fontSize: 26, color: '#0A235A' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  signupText: { fontFamily: 'NunitoSans-Regular', fontSize: 14, color: '#FFEFC2' },
  signupLink: { fontFamily: 'NunitoSans-Bold', fontSize: 15, color: '#FFB627', textDecorationLine: 'underline' },
});