import React from 'react';
import { PILLARS, getPeriodKey } from '../pillars';

export default function MemberProfile({ member, groupData, today, onClose }) {
  const goals = groupData?.goals?.[member.id] || {};
  const completions = groupData?.completions || {};
  const stars = groupData?.stars?.[member.id] || 0;
  const streak = groupData?.streaks?.[member.id]?.current || 0;
  const bestStreak = groupData?.streaks?.[member.id]?.best || 0;

  const isGoalDone = (goal) => {
    const periodKey = getPeriodKey(goal.frequency || 'daily');
    return !!completions[periodKey]?.[member.id]?.[goal.id];
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar" style={{ '--av': member.color }}>{member.name[0]?.toUpperCase()}</div>
          <div>
            <div className="profile-name">{member.name}</div>
            <div className="profile-meta">Joined {new Date(member.joinedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="pstat"><div className="pstat-num">{stars}</div><div className="pstat-lbl">⭐ Stars</div></div>
          <div className="pstat"><div className="pstat-num">{streak}</div><div className="pstat-lbl">🔥 Streak</div></div>
          <div className="pstat"><div className="pstat-num">{bestStreak}</div><div className="pstat-lbl">🏆 Best</div></div>
        </div>

        {/* Public goals by pillar */}
        <div className="profile-goals-title">Public Goals</div>
        {PILLARS.map(p => {
          const pillarGoals = (goals[p.id] || []).filter(g => g.isPublic !== false);
          if (pillarGoals.length === 0) return null;
          return (
            <div key={p.id} className="profile-pillar-section" style={{ '--pp': p.color, '--ppbg': p.colorLight }}>
              <div className="profile-pillar-header">
                <span className="profile-pillar-icon">{p.icon}</span>
                <span className="profile-pillar-name">{p.name}</span>
              </div>
              <div className="profile-goal-list">
                {pillarGoals.map(goal => (
                  <div key={goal.id} className={`profile-goal-row ${isGoalDone(goal) ? 'done' : ''}`}>
                    <div className="profile-goal-check">{isGoalDone(goal) ? '✓' : ''}</div>
                    <span className="profile-goal-text">{goal.text}</span>
                    <span className="profile-goal-freq">{goal.frequency || 'daily'}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {PILLARS.every(p => (goals[p.id] || []).filter(g => g.isPublic !== false).length === 0) && (
          <p className="profile-empty">This member has no public goals yet.</p>
        )}
      </div>
    </div>
  );
}
