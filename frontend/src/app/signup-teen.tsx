import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import WarliBackground from "../components/WarliBackground";

import { api, errorText, saveSession } from '../lib/api';

export default function TeenSignup() {
  const router = useRouter();
  const { lang } = useLocalSearchParams();

  const [name, setName] = useState('');
  const [teenContact, setTeenContact] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isParentEmail = parentContact.includes('@');

  const rules = [
    { label: 'Minimum 8 characters', ok: password.length >= 8 },
    { label: 'Min 1 capital letter (A-Z)', ok: /[A-Z]/.test(password) },
    { label: 'Min 1 lowercase letter (a-z)', ok: /[a-z]/.test(password) },
    { label: 'Min 1 digit (0-9)', ok: /[0-9]/.test(password) },
    { label: 'Min 1 special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const allValid = rules.every(r => r.ok);

  // The backend has no OTP step, so signing up creates the account and logs in straight away.
  // The parent then links this teen from their dashboard using the teen's email.
  const sendOtp = async () => {
    if (!name || !teenContact || !parentContact || !allValid) return;
    if (teenContact === parentContact) {
      alert('Teen and Parent contact should be different');
      return;
    }
    if (!teenContact.includes('@')) {
      alert('Please sign up with your email address');
      return;
    }
    setLoading(true);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        token: null,
        body: { name: name.trim(), email: teenContact.trim(), password, role: 'teen' },
      });
      await saveSession(data.token, data.user);
      router.replace({ pathname: '/teen-dashboard', params: { lang } });
    } catch (e) {
      alert(errorText(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <WarliBackground />
      <ScrollView style={{ flex: 1, zIndex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Teen SignUp</Text>
        <Text style={styles.sub}>Create your account, take control!</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={[styles.input, focused === 'name' && styles.inputActive]} placeholder="Enter Your Name" value={name} onChangeText={setName} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} />

        <Text style={styles.label}>Your Email</Text>
        <TextInput style={[styles.input, focused === 'teen' && styles.inputActive]} placeholder="Enter your email" value={teenContact} onChangeText={setTeenContact} autoCapitalize="none" keyboardType="email-address" onFocus={() => setFocused('teen')} onBlur={() => setFocused(null)} />

        <Text style={styles.label}>Parent's Email or Mobile (optional)</Text>
        <TextInput style={[styles.input, focused === 'parent' && styles.inputActive]} placeholder="Parent's email or mobile" value={parentContact} onChangeText={setParentContact} autoCapitalize="none" keyboardType="email-address" onFocus={() => setFocused('parent')} onBlur={() => setFocused(null)} />
        {parentContact.length > 3 && (
          <Text style={styles.hint}>Your parent will link your account using your email</Text>
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

        <TouchableOpacity style={[styles.btn, (!name || !teenContact || !parentContact || !allValid || loading) && styles.btnDisabled]} onPress={sendOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#0A235A" /> : <Text style={styles.btnText}>Sign Up</Text>}
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