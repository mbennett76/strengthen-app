import React from 'react';
import { useApp } from '../App';
import { TROPHIES, PILLARS } from '../pillars';
import ScriptureBanner from './ScriptureBanner';

export default function TrophyRoom() {
  const { user, currentGroupData, goHome } = useApp();

  const stars = currentGroupData?.stars?.[user.id] || 0;
  const streakData = currentGroupData?.streaks?.[user.id] || { current: 0, best: 0 };
  const earned = currentGroupData?.trophies?.[user.id] || {};
  const members = currentGroupData?.members || {};
  const daily = currentGroupData?.dailyStats || {};

  let allFourDays = 0, spiritualDays = 0, socialDays = 0, physicalDays = 0, intellectualDays = 0;
  Object.values(daily).forEach(d => {
    const u = d?.[user.id];
    if (!u) return;
    if (u.spiritual) spiritualDays++;
    if (u.socialFamily) socialDays++;
    if (u.physical) physicalDays++;
    if (u.intellectual) intellectualDays++;
    if (u.spiritual && u.socialFamily && u.physical && u.intellectual) allFourDays++;
  });

  const stats = { totalStars: stars, currentStreak: streakData.current, bestStreak: streakData.best || 0, allFourDays, spiritualDays, socialDays, physicalDays, intellectualDays };

  const earnedList = TROPHIES.filter(t => earned[t.id]);
  const lockedList = TROPHIES.filter(t => !earned[t.id]);

  const memberList = Object.entries(members).map(([id, m]) => ({
    id, ...m,
    stars: currentGroupData?.stars?.[id] || 0,
    streak: currentGroupData?.streaks?.[id]?.current || 0,
  })).sort((a, b) => b.stars - a.stars);

  const myRank = memberList.findIndex(m => m.id === user.id) + 1;
  const fireLevel = streakData.current >= 30 ? 4 : streakData.current >= 14 ? 3 : streakData.current >= 7 ? 2 : streakData.current >= 3 ? 1 : 0;
  const fireEmojis = ['', '🔥', '🔥🔥', '🔥🔥🔥', '🔥🔥🔥🔥'];

  const pillarCounts = { spiritual: spiritualDays, socialFamily: socialDays, physical: physicalDays, intellectual: intellectualDays };

  return (
    <div className="screen">
      <ScriptureBanner />
      <div className="screen-header">
        <div className="header-top">
          <button className="home-back-btn" onClick={goHome}>← Home</button>
          <div style={{ marginLeft: 8 }}>
            <h2 className="screen-title">Trophy Room</h2>
            <p className="screen-sub">{user.name}'s achievements</p>
          </div>
        </div>
      </div>

      <div className="trophy-hero">
        <div className="trophy-hero-av" style={{ '--av': user.color }}>{user.name[0]?.toUpperCase()}</div>
        <div className="trophy-hero-name">{user.name}</div>
        {myRank <= 3 && <div className="trophy-rank">#{myRank} in group</div>}
        <div className="trophy-big-stats">
          <div className="big-stat"><div className="big-stat-num">{stars}</div><div className="big-stat-lbl">⭐ Stars</div></div>
          <div className="big-stat"><div className="big-stat-num">{streakData.current}</div><div className="big-stat-lbl">{fireLevel > 0 ? fireEmojis[fireLevel] : '💧'} Streak</div></div>
          <div className="big-stat"><div className="big-stat-num">{streakData.best || 0}</div><div className="big-stat-lbl">🏆 Best</div></div>
        </div>
      </div>

      {streakData.current > 0 && (
        <div className="streak-visual">
          <div className="streak-flame">{fireLevel === 0 ? '🕯️' : fireEmojis[fireLevel]}</div>
          <div className="streak-text">
            <strong>{streakData.current}-day streak!</strong>
            {streakData.current < 3 && ' Keep going — 3 more days for a trophy!'}
            {streakData.current >= 3 && streakData.current < 7 && " You're on fire!"}
            {streakData.current >= 7 && ' Incredible consistency!'}
          </div>
        </div>
      )}

      <div className="section-label">Pillar Progress</div>
      <div className="pillar-badges-row">
        {PILLARS.map(p => {
          const count = pillarCounts[p.id] || 0;
          const level = count >= 20 ? 'gold' : count >= 10 ? 'silver' : count >= 5 ? 'bronze' : count >= 1 ? 'active' : 'empty';
          return (
            <div key={p.id} className={`pillar-badge ${level}`} style={{ '--pb': p.color, '--pbbg': p.colorLight }}>
              <div className="pb-icon">{p.icon}</div>
              <div className="pb-name">{p.name.split('/')[0]}</div>
              <div className="pb-count">{count}d</div>
            </div>
          );
        })}
      </div>

      {earnedList.length > 0 && (
        <>
          <div className="section-label">🏆 Earned Trophies ({earnedList.length})</div>
          <div className="trophy-grid">
            {earnedList.map(t => (
              <div key={t.id} className="trophy-tile earned">
                <div className="trophy-icon">{t.icon}</div>
                <div className="trophy-name">{t.name}</div>
                <div className="trophy-desc">{t.desc}</div>
                <div className="trophy-date">{new Date(earned[t.id]).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-label">🔒 Locked ({lockedList.length})</div>
      <div className="trophy-grid">
        {lockedList.map(t => (
          <div key={t.id} className="trophy-tile locked">
            <div className="trophy-icon locked">{t.icon}</div>
            <div className="trophy-name">{t.name}</div>
            <div className="trophy-desc">{t.desc}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Group Leaderboard</div>
      <div className="leaderboard">
        {memberList.slice(0, 10).map((m, i) => (
          <div key={m.id} className={`lb-row ${m.id === user.id ? 'me' : ''}`}>
            <div className="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
            <div className="lb-av" style={{ '--av': m.color }}>{m.name[0]?.toUpperCase()}</div>
            <div className="lb-name">{m.name}{m.id === user.id ? ' (You)' : ''}</div>
            <div className="lb-stars">⭐ {m.stars}</div>
            {m.streak > 0 && <div className="lb-streak">🔥{m.streak}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
