import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// ============================================
// 🔌 BACKEND - CHANGE URL ONLY HERE
// ============================================
const API_URL = 'https://YOUR-BACKEND.com/api';

async function safeFetch(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`);
    return await res.json();
  } catch (e) {
    return null; // If backend is off, mock data will show, app will not crash
  }
}

// ============================================
// 🔥 MOCK DATA - This will show if backend is not running
// ============================================
const MOCK_FRIENDS = [
  { name: 'Aarav (You)', xp: 205, saved: 800, lessons: 5, color: '#FFD93D', isMe: true },
  { name: 'Mia Sharma', xp: 198, saved: 750, lessons: 4, color: '#B983FF' },
  { name: 'Kabir Mehta', xp: 185, saved: 690, lessons: 5, color: '#4D96FF' },
  { name: 'Zara Khan', xp: 172, saved: 620, lessons: 4, color: '#FF6B9D' },
  { name: 'Arjun Singh', xp: 165, saved: 600, lessons: 5, color: '#6BCB77' },
  { name: 'Ira Gupta', xp: 148, saved: 540, lessons: 3, color: '#FF9F45' },
  { name: 'Vihaan Patel', xp: 132, saved: 480, lessons: 3, color: '#4ECDC4' },
  { name: 'Anaya Verma', xp: 118, saved: 410, lessons: 2, color: '#FF6B6B' },
  { name: 'Rohan Joshi', xp: 95, saved: 320, lessons: 2, color: '#95A5A6' },
  { name: 'Diya Nair', xp: 78, saved: 250, lessons: 1, color: '#F39C12' },
  { name: 'Aryan Khanna', xp: 62, saved: 180, lessons: 1, color: '#8E44AD' },
  { name: 'Sana Sheikh', xp: 45, saved: 120, lessons: 0, color: '#3498DB' },
];

const MOCK_LEAGUES = [
  { id: 1, name: 'Newbie', img: require('../../assets/league/newbie1.png'), unlocked: true, bg: '#FFD93D', border: '#FFB627', glow: '#FFE97A' },
  { id: 2, name: 'Rider', img: require('../../assets/league/rider2.png'), unlocked: false, bg: '#B983FF', border: '#8A2BE2', glow: '#D5B3FF' },
  { id: 3, name: 'Strategist', img: require('../../assets/league/strategist3.png'), unlocked: false, bg: '#4D96FF', border: '#2E6BFF', glow: '#8FB8FF' },
  { id: 4, name: 'Legacy', img: require('../../assets/league/legacy4.png'), unlocked: false, bg: '#FF6B9D', border: '#FF2E7A', glow: '#FFA8C5' },
  { id: 5, name: 'Titan', img: require('../../assets/league/titan5.png'), unlocked: false, bg: '#FF9F45', border: '#FF6B00', glow: '#FFC48A' },
];

export default function League() {
  const router = useRouter();
  const [leagues, setLeagues] = useState(MOCK_LEAGUES);
  const [friends, setFriends] = useState(MOCK_FRIENDS);
  const [isLive, setIsLive] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockLeague, setUnlockLeague] = useState(MOCK_LEAGUES[1]);

  const spin = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.2)).current;

  // 🔌 TRY BACKEND, IF IT FAILS KEEP MOCK DATA
  useEffect(() => {
    safeFetch('/league').then(d => { if (d?.leagues?.length) { setLeagues(d.leagues); setIsLive(true); } });
    safeFetch('/leaderboard').then(d => { if (d?.length) { setFriends(d); setIsLive(true); } });
  }, []);

  const promoteTopHalf = async () => {
    await safeFetch('/league/promote?userId=aarav-123');
    const next = leagues.find(l => !l.unlocked);
    if (!next) return;
    setUnlockLeague(next);
    setShowUnlock(true);
    spin.setValue(0);
    scale.setValue(0.2);
    Animated.parallel([
      Animated.timing(spin, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ]).start();
    setTimeout(() => {
      setShowUnlock(false);
      setLeagues(leagues.map(l => l.id === next.id ? { ...l, unlocked: true } : l));
    }, 2500);
  };

  const spinInterpolate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });

  return (
    <View style={{flex:1, backgroundColor:'#002E6E'}}>
    <ScrollView style={s.c} showsVerticalScrollIndicator={false}>
      <View style={s.top}>
        <TouchableOpacity onPress={()=> router.back()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>🏆 League</Text>
        <View style={s.daysPill}><Text style={s.daysText}>⏳ 12 days left</Text></View>
      </View>

      <View style={[s.liveBadge, { backgroundColor: isLive ? '#00C853' : '#FFD93D' }]}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: isLive ? '#fff' : '#002E6E' }}>
          {isLive ? '🟢 LIVE - Backend Connected' : '🟡 DEMO - Mock Data (Backend Off)'}
        </Text>
      </View>

      <View style={s.infoBox}>
        <Text style={{fontWeight:'800', color:'#fff', fontSize:15}}>🔥 Next Result: In 15 Days</Text>
        <Text style={{color:'#E0E0FF', fontSize:12, marginTop:4}}>Top 5 🟢 → Next League Promote • Bottom 5 🔴 → Demote</Text>
        <View style={s.progressBg}><View style={[s.progressFill, {width:'20%'}]} /></View>
        <Text style={{color:'#E0E0FF', fontSize:10, marginTop:4}}>3 / 15 days complete</Text>
      </View>

      <Text style={s.head}>✨ My Leagues</Text>
      <View style={s.leagueRow}>
        {leagues.map(l => (
          <View key={l.id} style={{alignItems:'center', width: width*0.17}}>
            <View style={[s.circle, {backgroundColor: l.unlocked ? l.bg : '#2A2A4A', borderColor: l.unlocked ? l.border : '#444', shadowColor: l.unlocked ? l.glow : 'transparent', shadowOpacity: l.unlocked ? 0.8 : 0, shadowRadius: 10, elevation: l.unlocked ? 8 : 0}]}>
              {l.unlocked ? <Image source={l.img} style={s.leagueImg} /> : <Text style={{fontSize:22}}>🔒</Text>}
            </View>
            <Text style={[s.leagueName, {color: l.unlocked ? l.bg : '#888'}]}>{l.name}</Text>
            <View style={[s.statusPill, {backgroundColor: l.unlocked ? l.bg : '#333'}]}>
              <Text style={{fontSize:8, fontWeight:'800', color: l.unlocked ? '#002E6E' : '#aaa'}}>{l.unlocked ? 'UNLOCKED' : 'LOCKED'}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={s.head}>🏅 Leaderboard - Newbie</Text>
      <View style={s.legendRow}>
        <View style={s.legend}><View style={[s.legendDot, {backgroundColor:'#6BCB77'}]} /><Text style={s.legendText}>Top 5 Promote</Text></View>
        <View style={s.legend}><View style={[s.legendDot, {backgroundColor:'#FF6B6B'}]} /><Text style={s.legendText}>Bottom 5 Demote</Text></View>
      </View>

      {friends.map((f: any, i) => (
        <View key={f.name} style={[s.row, {borderLeftColor: i < 5 ? '#6BCB77' : '#FF6B6B', backgroundColor: i===0 ? '#FFF9C4' : i < 5 ? '#E8FFF0' : '#FFF0F0'}]}>
          <View style={[s.rankCircle, {backgroundColor: i===0 ? '#FFD93D' : i===1 ? '#E0E0E0' : i===2 ? '#FF9F45' : '#002E6E'}]}>
            <Text style={{fontWeight:'800', color: i<3 ? '#000' : '#fff'}}>{i+1}</Text>
          </View>
          <View style={[s.avatar, {backgroundColor: f.color}]}><Text style={{fontWeight:'800', color:'#fff', fontSize:16}}>{f.name[0]}</Text></View>
          <View style={{flex:1, marginLeft:10}}>
            <Text style={s.fName}>{f.name} {i===0 && '👑'}</Text>
            <Text style={{color:'#666', fontSize:11}}>💰 ₹{f.saved} • 📚 {f.lessons} Lessons</Text>
          </View>
          <View style={[s.xpPill, {backgroundColor: i < 5 ? '#6BCB77' : '#FF6B6B'}]}>
            <Text style={{fontWeight:'800', color:'#fff', fontSize:12}}>{f.xp} XP</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.promoteBtn} onPress={promoteTopHalf}>
        <Text style={{fontWeight:'800', color:'#fff', fontSize:15}}>🎬 Demo: See Result After 15 Days →</Text>
      </TouchableOpacity>

      <View style={{height:100}} />
    </ScrollView>

    <Modal visible={showUnlock} transparent>
      <View style={[s.blackBg, {backgroundColor: unlockLeague.bg + '22'}]}>
        <View style={{backgroundColor:'rgba(0,0,0,0.92)', position:'absolute', top:0, bottom:0, left:0, right:0, alignItems:'center', justifyContent:'center'}}>
          <Animated.Image source={unlockLeague.img} style={{width: width*0.55, height: width*0.55, borderRadius: width*0.27, borderWidth:4, borderColor: unlockLeague.bg, transform: [{rotate: spinInterpolate}, {scale: scale}]}} />
          <Text style={{color: unlockLeague.bg, fontSize:26, fontWeight:'900', marginTop:18, textAlign:'center'}}>{unlockLeague.name} UNLOCKED! 🎉</Text>
          <Text style={{color:'#fff', marginTop:6, fontSize:14}}>Congratulations for reaching the Top Half! 🔥</Text>
          <View style={{backgroundColor: unlockLeague.bg, paddingHorizontal:18, paddingVertical:8, borderRadius:20, marginTop:16}}>
            <Text style={{fontWeight:'800', color:'#000'}}>+ 100 Bonus XP 🪙</Text>
          </View>
        </View>
      </View>
    </Modal>

    <View style={s.nav}>
      <TouchableOpacity style={s.navBtn} onPress={()=> router.push('/teen-dashboard' as any)}><Text style={s.navText}>🏠{'\n'}Home</Text></TouchableOpacity>
      <TouchableOpacity style={s.navBtn}><Text style={s.navActive}>🏆{'\n'}League</Text></TouchableOpacity>
      <TouchableOpacity style={s.navBtn} onPress={()=> router.push('/piggy_bank' as any)}><Text style={s.navText}>🐷{'\n'}Piggy</Text></TouchableOpacity>
      <TouchableOpacity style={s.navBtn} onPress={()=> router.push('/lessons' as any)}><Text style={s.navText}>📚{'\n'}Lessons</Text></TouchableOpacity>
      <TouchableOpacity style={s.navBtn} onPress={()=> router.push('/investment' as any)}><Text style={s.navText}>📈{'\n'}Invest</Text></TouchableOpacity>
      <TouchableOpacity style={s.navBtn} onPress={()=> router.push('/transactions' as any)}><Text style={s.navText}>🧾{'\n'}History</Text></TouchableOpacity>
    </View>
    </View>
  );
}

const s = StyleSheet.create({
  c:{flex:1, padding: width*0.04, paddingTop:50},
  top:{flexDirection:'row', justifyContent:'space-between', alignItems:'center'},
  back:{color:'#fff', fontSize:15, fontWeight:'700'},
  title:{color:'#fff', fontSize:21, fontWeight:'900'},
  daysPill:{backgroundColor:'#FFD93D', paddingHorizontal:14, paddingVertical:8, borderRadius:18},
  daysText:{fontWeight:'900', fontSize:16, color:'#002E6E'},
  liveBadge:{ alignSelf:'flex-start', paddingHorizontal:10, paddingVertical:5, borderRadius:12, marginTop:12 },
  infoBox:{backgroundColor:'#1E4FFF', borderRadius:16, padding:14, marginTop:12, borderWidth:1, borderColor:'#A29BFE'},
  progressBg:{backgroundColor:'rgba(255,255,255,0.3)', height:8, borderRadius:4, width:'100%', marginTop:10},
  progressFill:{backgroundColor:'#FFD93D', height:8, borderRadius:4},
  head:{color:'#fff', fontWeight:'900', fontSize:17, marginTop:18, marginBottom:10},
  leagueRow:{flexDirection:'row', justifyContent:'space-between', backgroundColor:'#1E1E3E', borderRadius:16, padding:12, borderWidth:1, borderColor:'#333'},
  circle:{width: width*0.13, height: width*0.13, borderRadius: width*0.065, alignItems:'center', justifyContent:'center', borderWidth:2.5},
  leagueImg:{width: width*0.11, height: width*0.11, borderRadius: width*0.055},
  leagueName:{fontWeight:'800', fontSize:11, marginTop:5},
  statusPill:{paddingHorizontal:6, paddingVertical:2, borderRadius:8, marginTop:3},
  legendRow:{flexDirection:'row', gap:12, marginBottom:10},
  legend:{flexDirection:'row', alignItems:'center'},
  legendDot:{width:10, height:10, borderRadius:5},
  legendText:{color:'#fff', fontSize:11, marginLeft:5, fontWeight:'600'},
  row:{borderRadius:14, padding:12, flexDirection:'row', alignItems:'center', marginBottom:8, borderLeftWidth:5},
  rankCircle:{width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center'},
  avatar:{width:38, height:38, borderRadius:19, alignItems:'center', justifyContent:'center', marginLeft:8},
  fName:{fontWeight:'800', color:'#002E6E', fontSize:14},
  xpPill:{paddingHorizontal:10, paddingVertical:6, borderRadius:15},
  promoteBtn:{backgroundColor:'#FF6B9D', padding:16, borderRadius:16, marginTop:12, alignItems:'center', shadowColor:'#FF6B9D', shadowOpacity:0.5, shadowRadius:10, elevation:8},
  blackBg:{flex:1},
  nav:{flexDirection:'row', backgroundColor:'#fff', paddingVertical:8, paddingHorizontal:4, borderTopLeftRadius:16, borderTopRightRadius:16},
  navBtn:{flex:1, alignItems:'center'},
  navText:{textAlign:'center', fontSize:10, color:'#666', fontWeight:'600'},
  navActive:{textAlign:'center', fontSize:10, color:'#002E6E', fontWeight:'800'},
});