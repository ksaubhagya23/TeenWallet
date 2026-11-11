import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import WarliBackground from "../components/WarliBackground";

// ===== YAHIN PE BACKEND KA LOGIC HAI, KOI NAYI FILE NAHI =====
const API_URL = 'http://192.168.1.5:5000/api'; // Yahan apne laptop ka IP daal dena
const DEMO_OTP = '123456';

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

export default function ParentSignup() {
  const router = useRouter();
  const { lang } = useLocalSearchParams();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const isEmail = identifier.includes('@');
  const otpType = isEmail ? 'Email' : 'Mobile';

  const rules = [
    { label: 'Minimum 8 characters', ok: password.length >= 8 },
    { label: 'Min 1 capital letter (A-Z)', ok: /[A-Z]/.test(password) },
    { label: 'Min 1 lowercase letter (a-z)', ok: /[a-z]/.test(password) },
    { label: 'Min 1 digit (0-9)', ok: /[0-9]/.test(password) },
    { label: 'Min 1 special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const allValid = rules.every(r => r.ok);

  const sendOtp = async () => {
    if (!name || !identifier || !allValid) return;
    setLoading(true);
    const result = await apiCall('/auth/send-otp', {
      name, email: isEmail ? identifier : undefined, phone: !isEmail ? identifier : undefined, password, role: 'parent'
    });
    setLoading(false);

    if (result.isDemo) {
      setIsDemo(true);
      alert(`DEMO MODE: Backend off hai\nTest OTP: ${DEMO_OTP} daal ke aage badho`);
    } else {
      setIsDemo(false);
      alert(`OTP sent to your ${otpType}: ${identifier}`);
    }
    setStep(2);
  };

  const verifyOtp = async () => {
    setLoading(true);
    const result = await apiCall('/auth/verify-otp', {
      email: isEmail ? identifier : undefined, phone: !isEmail ? identifier : undefined, otp
    });
    setLoading(false);

    // 1. Real Backend - Token mila
    if (!result.isDemo && result.data?.token) {
      await AsyncStorage.setItem('token', result.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(result.data.user || { name, role: 'parent' }));
      router.replace({ pathname: '/parent-dashboard', params: { lang } });
      return;
    }

    // 2. Demo Mode - 123456 se login
    if ((result.isDemo || isDemo) && otp === DEMO_OTP) {
      await AsyncStorage.setItem('token', 'demo-token');
      await AsyncStorage.setItem('user', JSON.stringify({ name, role: 'parent', isDemo: true }));
      router.replace({ pathname: '/parent-dashboard', params: { lang } });
      return;
    }

    alert(result.data?.message || 'Wrong OTP, try again');
  };

  const resendOtp = async () => {
    if (isDemo) {
      alert(`DEMO MODE: OTP is ${DEMO_OTP}`);
      return;
    }
    await sendOtp();
  };

  // ===== STEP 2 - OTP SCREEN =====
  if (step === 2) {
    return (
      <View style={styles.container}>
        <WarliBackground />
        <View style={{ flex: 1, zIndex: 1 }}>
          <Text style={styles.heading}>Verify OTP</Text>
          <Text style={styles.sub}>We sent a 6-digit OTP to your {otpType}{'\n'}{identifier}</Text>
          {isDemo && <Text style={styles.demoBadge}>DEMO MODE - OTP: {DEMO_OTP}</Text>}

          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            style={[styles.input, focused === 'otp' && styles.inputActive]}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            onFocus={() => setFocused('otp')}
            onBlur={() => setFocused(null)}
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={verifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#0A235A" /> : <Text style={styles.btnText}>Verify & Login</Text>}
          </TouchableOpacity>

          <Pressable onPress={() => setStep(1)} style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={styles.loginLink}>Change Mobile / Email</Text>
          </Pressable>

          <Pressable onPress={resendOtp} style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={styles.resend}>Resend OTP</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ===== STEP 1 - SIGNUP FORM =====
  return (
    <View style={styles.container}>
      <WarliBackground />
      <ScrollView style={{ flex: 1, zIndex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Parent SignUp</Text>
        <Text style={styles.sub}>Create your account to manage your teen</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={[styles.input, focused === 'name' && styles.inputActive]} placeholder="Enter Your Name" value={name} onChangeText={setName} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} />

        <Text style={styles.label}>Mobile Number or Email</Text>
        <TextInput
          style={[styles.input, focused === 'id' && styles.inputActive]}
          placeholder="Enter Mobile / Email"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
          onFocus={() => setFocused('id')}
          onBlur={() => setFocused(null)}
        />
        {identifier.length > 3 && (
          <Text style={styles.hint}>OTP will be sent to your {otpType}</Text>
        )}

        <Text style={styles.label}>Password</Text>
        <View style={[styles.passWrap, focused === 'pass' && styles.inputActive]}>
          <TextInput style={styles.passInput} placeholder="Create Password" value={password} onChangeText={setPassword} secureTextEntry={!showPass} onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)} />
          <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPass ? '👁️' : '🙈'}</Text>
          </Pressable>
        </View>

        <View style={styles.checkList}>
          {rules.map((r, i) => (
            <View key={i} style={styles.checkRow}>
              <Text style={[styles.checkIcon, r.ok ? styles.checkOk : styles.checkNo]}>{r.ok ? '✓' : '○'}</Text>
              <Text style={[styles.checkText, r.ok ? styles.checkTextOk : styles.checkTextNo]}>{r.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.btn, (!name || !identifier || !allValid || loading) && styles.btnDisabled]} onPress={sendOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#0A235A" /> : <Text style={styles.btnText}>Send OTP</Text>}
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.loginLink}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A235A', padding: 28, paddingTop: 70 },
  heading: { fontFamily: 'NunitoSans-Bold', fontSize: 44, color: '#FFEFC2' },
  sub: { fontFamily: 'NunitoSans-Regular', fontSize: 15, color: '#FFEFC2', marginTop: 6, marginBottom: 30 },
  demoBadge: { fontFamily: 'NunitoSans-Bold', fontSize: 13, color: '#0A235A', backgroundColor: '#FFB627', padding: 10, borderRadius: 8, textAlign: 'center', marginBottom: 16 },
  label: { fontFamily: 'NunitoSans-Regular', fontSize: 16, color: '#FFFFFF', marginBottom: 8, marginTop: 16 },
  hint: { fontFamily: 'NunitoSans-Regular', fontSize: 12, color: '#FFB627', marginTop: 6 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, fontFamily: 'NunitoSans-Regular', fontSize: 16, borderWidth: 3, borderColor: 'transparent' },
  passWrap: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 3, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  passInput: { flex: 1, padding: 16, fontFamily: 'NunitoSans-Regular', fontSize: 16 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 20 },
  inputActive: { borderColor: '#FFB627' },
  checkList: { marginTop: 12, gap: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkIcon: { fontSize: 15, width: 20, textAlign: 'center' },
  checkOk: { color: '#4ADE80' },
  checkNo: { color: '#FFEFC2' },
  checkText: { fontFamily: 'NunitoSans-Regular', fontSize: 13 },
  checkTextOk: { color: '#4ADE80' },
  checkTextNo: { color: '#FFEFC2' },
  btn: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 28 },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontFamily: 'NunitoSans-Bold', fontSize: 24, color: '#0A235A' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18, marginBottom: 30 },
  loginText: { fontFamily: 'NunitoSans-Regular', fontSize: 14, color: '#FFEFC2' },
  loginLink: { fontFamily: 'NunitoSans-Bold', fontSize: 15, color: '#FFB627', textDecorationLine: 'underline' },
  resend: { fontFamily: 'NunitoSans-Regular', fontSize: 14, color: '#FFFFFF' },
});