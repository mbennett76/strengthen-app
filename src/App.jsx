import React, { useState, useEffect, createContext, useContext } from 'react';
import { db } from './firebase';
import { ref, onValue, set, get, update, push } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { PILLARS, TROPHIES, getToday, getPeriodKey } from './pillars';
import JoinScreen from './components/JoinScreen';
import HomeScreen from './components/HomeScreen';
import PersonalGoals from './components/PersonalGoals';
import Dashboard from './components/Dashboard';
import MyGoals from './components/MyGoals';
import GroupFeed from './components/GroupFeed';
import TrophyRoom from './components/TrophyRoom';

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

function App() {
  const [user, setUser]               = useState(null);
  const [groupsData, setGroupsData]   = useState({});
  const [screen, setScreen]           = useState('home');
  const [activeGroup, setActiveGroup] = useState(null); // code of group currently open
  const [booting, setBooting]         = useState(true);

  // ── Boot: load & migrate user ──────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('strengthen_user_v2');
      if (saved) { setUser(JSON.parse(saved)); setBooting(false); return; }
      const old = localStorage.getItem('strengthen_user');
      if (old) {
        const o = JSON.parse(old);
        const migrated = { id: o.id, name: o.name, color: o.color,
          groups: o.groupCode ? [o.groupCode] : [], currentGroup: o.groupCode || null };
        localStorage.setItem('strengthen_user_v2', JSON.stringify(migrated));
        localStorage.removeItem('strengthen_user');
        setUser(migrated);
        setBooting(false);
        return;
      }
    } catch (e) {}
    setBooting(false);
  }, []);

  // ── Subscribe to all groups ────────────────────────────────────────────
  useEffect(() => {
    if (!user?.groups?.length) return;
    const unsubs = user.groups.map(code =>
      onValue(ref(db, `groups/${code}`), snap => {
        setGroupsData(prev => ({ ...prev, [code]: snap.exists() ? snap.val() : null }));
      })
    );
    return () => unsubs.forEach(u => u());
  }, [user?.groups?.join(',')]);

  const saveUser = (u) => {
    localStorage.setItem('strengthen_user_v2', JSON.stringify(u));
    setUser(u);
  };

  // ── Navigation ─────────────────────────────────────────────────────────
  const goHome = () => { setScreen('home'); setActiveGroup(null); };

  const enterGroup = (code) => {
    setActiveGroup(code);
    const updated = { ...user, currentGroup: code };
    saveUser(updated);
    setScreen('dashboard');
  };

  const addGroupToUser = (code) => {
    const groups = [...(user.groups || [])];
    if (!groups.includes(code)) groups.push(code);
    saveUser({ ...user, groups, currentGroup: code });
  };

  const handleJoinDone = (userData) => {
    saveUser(userData);
    setActiveGroup(userData.currentGroup);
    setScreen('home');
  };

  // ── Leave group ────────────────────────────────────────────────────────
  const handleLeaveGroup = async (code) => {
    try { await set(ref(db, `groups/${code}/members/${user.id}`), null); } catch (e) {}
    const groups = (user.groups || []).filter(g => g !== code);
    saveUser({ ...user, groups, currentGroup: groups[0] || null });
    setGroupsData(prev => { const n = { ...prev }; delete n[code]; return n; });
    goHome();
  };

  // ── Stars & streaks ────────────────────────────────────────────────────
  const addStar = async (userId, groupCode) => {
    const r = ref(db, `groups/${groupCode}/stars/${userId}`);
    const snap = await get(r);
    await set(r, (snap.exists() ? snap.val() : 0) + 1);
  };

  const updateStreak = async (userId, groupCode) => {
    const today = getToday();
    const r = ref(db, `groups/${groupCode}/streaks/${userId}`);
    const snap = await get(r);
    const s = snap.exists() ? snap.val() : { current: 0, best: 0, lastDate: null };
    if (s.lastDate === today) return s;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const newCurrent = s.lastDate === yStr ? s.current + 1 : 1;
    const ns = { current: newCurrent, best: Math.max(newCurrent, s.best || 0), lastDate: today };
    await set(r, ns);
    return ns;
  };

  const addFeedEntry = async (groupCode, entry) => {
    await push(ref(db, `groups/${groupCode}/feed`), { ...entry, ts: Date.now() });
  };

  const updateDailyStat = async (groupCode, userId, pillarId, hasDone) => {
    await set(ref(db, `groups/${groupCode}/dailyStats/${getToday()}/${userId}/${pillarId}`), hasDone);
  };

  const checkAndAwardTrophies = async (userId, groupCode) => {
    const snap = await get(ref(db, `groups/${groupCode}`));
    if (!snap.exists()) return;
    const data = snap.val();
    const stars = data.stars?.[userId] || 0;
    const streak = data.streaks?.[userId] || { current: 0, best: 0 };
    const daily = data.dailyStats || {};
    let allFourDays = 0, spiritualDays = 0, socialDays = 0, physicalDays = 0, intellectualDays = 0;
    Object.values(daily).forEach(d => {
      const u = d?.[userId]; if (!u) return;
      if (u.spiritual) spiritualDays++;
      if (u.socialFamily) socialDays++;
      if (u.physical) physicalDays++;
      if (u.intellectual) intellectualDays++;
      if (u.spiritual && u.socialFamily && u.physical && u.intellectual) allFourDays++;
    });
    const stats = { totalStars: stars, bestStreak: streak.best || 0,
      allFourDays, spiritualDays, socialDays, physicalDays, intellectualDays };
    const existing = data.trophies?.[userId] || {};
    const updates = {};
    TROPHIES.forEach(t => {
      if (!existing[t.id] && t.condition(stats))
        updates[`groups/${groupCode}/trophies/${userId}/${t.id}`] = Date.now();
    });
    if (Object.keys(updates).length) await update(ref(db), updates);
  };

  // ── Cross-group goal sync ──────────────────────────────────────────────
  const syncGoalAcrossGroups = async (goalText, pillarId, isDone, skipGroupCode) => {
    for (const code of (user.groups || [])) {
      if (code === skipGroupCode) continue;
      const otherGoals = groupsData[code]?.goals?.[user.id]?.[pillarId] || [];
      const match = otherGoals.find(g => g.text === goalText);
      if (match) {
        const pk = getPeriodKey(match.frequency || 'daily');
        await set(ref(db, `groups/${code}/completions/${pk}/${user.id}/${match.id}`), isDone ? true : null);
        // Also update daily stat for that group
        const anyDone = otherGoals.some(g =>
          g.id === match.id ? isDone : false
        );
        await updateDailyStat(code, user.id, pillarId, isDone || anyDone);
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (booting) return (
    <div className="boot-screen">
      <div className="boot-logo">✦</div>
      <div className="boot-name">Strengthen</div>
    </div>
  );

  // First-time user — no account yet
  if (!user) {
    return <JoinScreen onJoin={handleJoinDone} existingUser={null} addGroupToUser={addGroupToUser} groupsData={groupsData} />;
  }

  // Add group flow triggered from home
  if (screen === 'add-group') {
    return <JoinScreen onJoin={handleJoinDone} existingUser={user} addGroupToUser={addGroupToUser} groupsData={groupsData} onCancel={goHome} />;
  }

  const currentGroupData = activeGroup ? (groupsData[activeGroup] || null) : null;

  const ctx = {
    user, groupsData, currentGroupData, activeGroup, db,
    today: getToday(), screen, setScreen,
    goHome, enterGroup, addGroupToUser, handleLeaveGroup,
    addStar, updateStreak, addFeedEntry, updateDailyStat,
    checkAndAwardTrophies, syncGoalAcrossGroups,
  };

  const navItems = [
    { id: 'dashboard', icon: '⊞', label: 'Group' },
    { id: 'goals',     icon: '✦', label: 'My Goals' },
    { id: 'feed',      icon: '◉', label: 'Feed' },
    { id: 'trophies',  icon: '🏆', label: 'Trophies' },
  ];

  const inGroup = ['dashboard','goals','feed','trophies'].includes(screen);

  return (
    <AppContext.Provider value={ctx}>
      <div className="app">
        <main className="screen-content">
          {screen === 'home'     && <HomeScreen />}
          {screen === 'personal' && <PersonalGoals />}
          {screen === 'dashboard' && <Dashboard />}
          {screen === 'goals'     && <MyGoals />}
          {screen === 'feed'      && <GroupFeed />}
          {screen === 'trophies'  && <TrophyRoom />}
        </main>
        {inGroup && (
          <nav className="bottom-nav">
            {navItems.map(item => (
              <button key={item.id} className={`nav-btn ${screen === item.id ? 'active' : ''}`}
                onClick={() => setScreen(item.id)}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </AppContext.Provider>
  );
}

export default App;
