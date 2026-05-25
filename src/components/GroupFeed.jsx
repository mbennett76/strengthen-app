import React, { useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { useApp } from '../App';
import { PILLARS, formatTime } from '../pillars';
import ScriptureBanner from './ScriptureBanner';
import ProgressCalendar from './ProgressCalendar';

const REACTIONS = ['🔥', '✨', '💪', '❤️', '👏'];

export default function GroupFeed() {
  const { user, currentGroupData, db, goHome } = useApp();
  const [reacting, setReacting] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const feed = currentGroupData?.feed || {};
  const reactions = currentGroupData?.reactions || {};

  const feedEntries = Object.entries(feed)
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 60);

  const handleReact = async (feedId, emoji) => {
    const r = ref(db, `groups/${user.currentGroup}/reactions/${feedId}/${user.id}`);
    const snap = await get(r);
    await set(r, snap.exists() && snap.val() === emoji ? null : emoji);
    setReacting(null);
  };

  const getReactionCounts = (feedId) => {
    const counts = {};
    Object.values(reactions[feedId] || {}).forEach(e => { counts[e] = (counts[e] || 0) + 1; });
    return counts;
  };

  if (showCalendar) return (
    <div className="screen">
      <ScriptureBanner />
      <div className="screen-header">
        <div className="header-top">
          <button className="home-back-btn" onClick={goHome}>← Home</button>
          <h2 className="screen-title" style={{ flex:1, marginLeft:8 }}>Progress Calendar</h2>
          <button className="icon-btn" onClick={() => setShowCalendar(false)}>✕ Close</button>
        </div>
      </div>
      <ProgressCalendar groupData={currentGroupData} currentUserId={user.id} />
    </div>
  );

  return (
    <div className="screen">
      <ScriptureBanner />
      <div className="screen-header">
        <div className="header-top">
          <button className="home-back-btn" onClick={goHome}>← Home</button>
          <div style={{ flex: 1, marginLeft: 8 }}>
            <h2 className="screen-title">Group Feed</h2>
            <p className="screen-sub">{feedEntries.length} updates</p>
          </div>
          <button className="calendar-btn" onClick={() => setShowCalendar(true)} title="Progress Calendar">
            📅 Calendar
          </button>
        </div>
      </div>

      {feedEntries.length === 0 ? (
        <div className="empty-feed">
          <div className="empty-icon">◉</div>
          <p>No activity yet.</p>
          <p className="empty-sub">Complete some goals and they'll show up here!</p>
        </div>
      ) : (
        <div className="feed-list">
          {feedEntries.map(entry => {
            const pillar = PILLARS.find(p => p.id === entry.pillar);
            const rCounts = getReactionCounts(entry.id);
            const myR = reactions[entry.id]?.[user.id];
            const isComplete = entry.type === 'pillar_complete';
            const isOpen = reacting === entry.id;

            return (
              <div key={entry.id} className={`feed-entry ${isComplete ? 'pillar-complete' : ''}`}
                style={pillar ? { '--fe': pillar.color, '--febg': pillar.colorLight } : {}}>
                <div className="feed-avatar" style={{ '--av': entry.color }}>{entry.name?.[0]?.toUpperCase() || '?'}</div>
                <div className="feed-body">
                  <div className="feed-top">
                    <span className="feed-name">{entry.name}</span>
                    {entry.userId === user.id && <span className="feed-you-tag">you</span>}
                    <span className="feed-time">{formatTime(entry.ts)}</span>
                  </div>
                  {isComplete ? (
                    <div className="feed-action complete">
                      <span>{pillar?.icon}</span>
                      <span>{entry.text}</span>
                      <span>🏅</span>
                    </div>
                  ) : (
                    <div className="feed-action">
                      {pillar && (
                        <span className="feed-pillar-chip" style={{ '--fpc': pillar.color, '--fpcbg': pillar.colorLight }}>
                          {pillar.icon} {pillar.name}
                        </span>
                      )}
                      <span className="feed-goal-text">"{entry.text}"</span>
                    </div>
                  )}
                  {Object.keys(rCounts).length > 0 && (
                    <div className="feed-reactions-row">
                      {Object.entries(rCounts).map(([emoji, count]) => (
                        <button key={emoji} className={`reaction-pill ${myR === emoji ? 'mine' : ''}`}
                          onClick={() => handleReact(entry.id, emoji)}>{emoji} {count}</button>
                      ))}
                    </div>
                  )}
                  <div className="feed-actions-row">
                    <button className="react-btn" onClick={() => setReacting(isOpen ? null : entry.id)}>
                      {myR || '+'} React
                    </button>
                  </div>
                  {isOpen && (
                    <div className="reaction-picker">
                      {REACTIONS.map(e => (
                        <button key={e} className={`reaction-opt ${myR === e ? 'active' : ''}`}
                          onClick={() => handleReact(entry.id, e)}>{e}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
