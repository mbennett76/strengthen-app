import React from 'react';
import { useApp } from '../App';
import ScriptureBanner from './ScriptureBanner';
import { PILLARS } from '../pillars';

export default function HomeScreen() {
  const { user, groupsData, enterGroup, setScreen } = useApp();

  const groups = (user.groups || [])
    .filter(code => groupsData[code])
    .map(code => ({
      code,
      name: groupsData[code]?.meta?.name || code,
      memberCount: Object.keys(groupsData[code]?.members || {}).length,
      myStars: groupsData[code]?.stars?.[user.id] || 0,
      myStreak: groupsData[code]?.streaks?.[user.id]?.current || 0,
      myPillars: (() => {
        const today = new Date().toISOString().split('T')[0];
        const stats = groupsData[code]?.dailyStats?.[today]?.[user.id] || {};
        return PILLARS.filter(p => stats[p.id]).length;
      })(),
    }));

  return (
    <div className="home-screen">
      <ScriptureBanner />

      {/* User welcome */}
      <div className="home-header">
        <div className="home-avatar" style={{ '--av': user.color }}>
          {user.name[0]?.toUpperCase()}
        </div>
        <div>
          <div className="home-welcome">Welcome back,</div>
          <div className="home-name">{user.name}</div>
        </div>
      </div>

      {/* Personal Goals */}
      <button className="personal-goals-btn" onClick={() => setScreen('personal')}>
        <div className="pgb-pillars">
          {PILLARS.map(p => (
            <span key={p.id} style={{ color: p.color, fontSize: 16 }}>{p.icon}</span>
          ))}
        </div>
        <div className="pgb-info">
          <div className="pgb-title">My Personal Goals</div>
          <div className="pgb-sub">All goals · private progress</div>
        </div>
        <div className="pgb-arrow">›</div>
      </button>

      {/* Groups */}
      <div className="section-label">My Groups</div>

      {groups.length === 0 ? (
        <div className="no-groups-msg">
          <p>You have not joined any groups yet.</p>
          <p className="no-groups-sub">Create or join one below.</p>
        </div>
      ) : (
        <div className="home-groups-list">
          {groups.map(g => (
            <button key={g.code} className="home-group-card" onClick={() => enterGroup(g.code)}>
              <div className="hgc-icon">{g.name[0]?.toUpperCase()}</div>
              <div className="hgc-info">
                <div className="hgc-name">{g.name}</div>
                <div className="hgc-meta">{g.memberCount} member{g.memberCount !== 1 ? 's' : ''} · Code: {g.code}</div>
              </div>
              <div className="hgc-right">
                <div className="hgc-stats">
                  {g.myStars > 0 && <span className="hgc-stat">⭐ {g.myStars}</span>}
                  {g.myStreak > 0 && <span className="hgc-stat">🔥 {g.myStreak}</span>}
                </div>
                <div className="hgc-progress">{g.myPillars}/4 today</div>
                <div className="hgc-arrow">›</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="home-actions">
        <button className="btn-primary" onClick={() => setScreen('add-group')}>
          + Create a Group
        </button>
        <button className="btn-secondary" onClick={() => setScreen('add-group')}>
          Join a Group
        </button>
      </div>

      <p className="home-verse">
        "And Jesus increased in wisdom and stature, and in favour with God and man." — Luke 2:52
      </p>
    </div>
  );
}
