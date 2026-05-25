import React, { useState } from 'react';
import { useApp } from '../App';
import { PILLARS } from '../pillars';
import ScriptureBanner from './ScriptureBanner';
import MemberProfile from './MemberProfile';

export default function Dashboard() {
  const { user, currentGroupData, activeGroup, today, goHome, handleLeaveGroup, setScreen } = useApp();
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (!currentGroupData) return (
    <div className="screen">
      <ScriptureBanner />
      <div className="loading-state"><div className="spinner" /><p>Connecting…</p></div>
    </div>
  );

  const meta = currentGroupData.meta || {};
  const members = currentGroupData.members || {};
  const dailyStats = currentGroupData.dailyStats?.[today] || {};
  const stars = currentGroupData.stars || {};
  const streaks = currentGroupData.streaks || {};

  const memberList = Object.entries(members).map(([id, m]) => ({
    id, ...m,
    stats: dailyStats[id] || {},
    stars: stars[id] || 0,
    streak: streaks[id]?.current || 0,
  })).sort((a, b) => {
    if (a.id === user.id) return -1;
    if (b.id === user.id) return 1;
    return b.stars - a.stars;
  });

  const myStats = dailyStats[user.id] || {};
  const myPillarsComplete = PILLARS.filter(p => myStats[p.id]).length;
  const topMember = [...memberList].sort((a, b) => b.stars - a.stars)[0];
  const topStreak = [...memberList].sort((a, b) => b.streak - a.streak)[0];

  const copyCode = () => {
    navigator.clipboard.writeText(activeGroup).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="screen">
      <ScriptureBanner />

      {selectedMember && (
        <MemberProfile member={selectedMember} groupData={currentGroupData}
          today={today} onClose={() => setSelectedMember(null)} />
      )}

      {/* Confirm leave modal */}
      {confirmLeave && (
        <div className="modal-overlay" onClick={() => setConfirmLeave(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()} style={{ maxHeight: 'auto', paddingBottom: 24 }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, marginBottom: 8 }}>Leave "{meta.name}"?</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.5 }}>
              You can rejoin at any time using the group code. Your stars and progress will still be there.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmLeave(false)}>Cancel</button>
              <button className="btn-leave" style={{ flex: 1, borderRadius: 12, padding: '12px 0' }}
                onClick={() => { setConfirmLeave(false); handleLeaveGroup(activeGroup); }}>
                Yes, Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="screen-header">
        <div className="header-top">
          <button className="home-back-btn" onClick={goHome}>← Home</button>
          <div style={{ flex: 1, marginLeft: 8 }}>
            <h2 className="screen-title">{meta.name || 'Group'}</h2>
            <p className="screen-sub">{memberList.length} members · {Object.values(dailyStats).filter(Boolean).length} active today</p>
          </div>
          <button className="code-badge" onClick={() => setShowCode(!showCode)}>
            {showCode ? activeGroup : '# CODE'}
          </button>
        </div>
        {showCode && (
          <div className="code-panel">
            <div className="code-display">{activeGroup}</div>
            <p className="code-hint">Share this code so others can join</p>
            <button className="btn-copy" onClick={copyCode}>{copied ? '✓ Copied!' : 'Copy Code'}</button>
          </div>
        )}
      </div>

      <div className="my-progress-card">
        <div className="mprog-label">Your progress today</div>
        <div className="mprog-pillars">
          {PILLARS.map(p => (
            <div key={p.id} className={`pillar-dot ${myStats[p.id] ? 'done' : ''}`}
              style={{ '--pd-color': p.color, '--pd-bg': p.colorLight }}>{p.icon}</div>
          ))}
        </div>
        <button className="btn-goto-goals" onClick={() => setScreen('goals')}>
          {myPillarsComplete < 4 ? 'Check off goals →' : 'All done! ✓'}
        </button>
      </div>

      {(topStreak?.streak > 0 || topMember?.stars > 0) && (
        <div className="stats-row">
          {topStreak?.streak > 0 && (
            <div className="stat-chip">
              <span>🔥</span>
              <div><div className="stat-val">{topStreak.streak}-day streak</div><div className="stat-name">{topStreak.name}</div></div>
            </div>
          )}
          {topMember?.stars > 0 && (
            <div className="stat-chip">
              <span>⭐</span>
              <div><div className="stat-val">{topMember.stars} stars</div><div className="stat-name">{topMember.name}</div></div>
            </div>
          )}
        </div>
      )}

      <div className="section-label">Group Members <span style={{ color: 'var(--text2)', fontWeight: 400 }}>(tap to view goals)</span></div>
      <div className="member-grid">
        {memberList.map(member => {
          const pillarsDone = PILLARS.filter(p => member.stats[p.id]).length;
          const isMe = member.id === user.id;
          const isTop = topMember?.id === member.id && member.stars > 0;
          return (
            <div key={member.id} className={`member-card ${isMe ? 'me' : ''}`}
              onClick={() => !isMe && setSelectedMember(member)}
              style={{ cursor: isMe ? 'default' : 'pointer' }}>
              {isTop && <div className="crown">👑</div>}
              <div className="member-avatar" style={{ '--av': member.color }}>{member.name[0]?.toUpperCase()}</div>
              <div className="member-name">{isMe ? `${member.name} (You)` : member.name}</div>
              <div className="member-pillars">
                {PILLARS.map(p => (
                  <div key={p.id} className={`member-pillar ${member.stats[p.id] ? 'done' : ''}`}
                    style={{ '--mp': p.color, '--mpbg': p.colorLight }} title={p.name}>{p.icon}</div>
                ))}
              </div>
              <div className="member-footer">
                <span className="member-stat">⭐ {member.stars}</span>
                {member.streak > 0 && <span className="member-stat">🔥 {member.streak}</span>}
                <span className={`member-pct ${pillarsDone === 4 ? 'perfect' : ''}`}>{pillarsDone}/4</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pillar-legend">
        {PILLARS.map(p => (
          <div key={p.id} className="legend-item">
            <span style={{ color: p.color }}>{p.icon}</span><span>{p.name}</span>
          </div>
        ))}
      </div>

      <div className="leave-group-section">
        <button className="btn-leave" onClick={() => setConfirmLeave(true)}>
          Leave This Group
        </button>
      </div>
    </div>
  );
}
