import React, { useState } from 'react';
import { ref, set, get, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../App';
import { PILLARS, FREQUENCIES, getPeriodKey } from '../pillars';
import ScriptureBanner from './ScriptureBanner';

export default function MyGoals() {
  const { user, currentGroupData, db, today, goHome, addStar, updateStreak, addFeedEntry, updateDailyStat, checkAndAwardTrophies, syncGoalAcrossGroups } = useApp();
  const [expanded, setExpanded] = useState('spiritual');
  const [customInputs, setCustomInputs] = useState({});
  const [newFreq, setNewFreq] = useState({});
  const [newPublic, setNewPublic] = useState({});
  const [saving, setSaving] = useState({});
  const [sparkle, setSparkle] = useState({});

  const groupCode = user.currentGroup;
  const myGoals = currentGroupData?.goals?.[user.id] || {};
  const completions = currentGroupData?.completions || {};
  const stars = currentGroupData?.stars?.[user.id] || 0;
  const streak = currentGroupData?.streaks?.[user.id]?.current || 0;

  const isGoalDone = (goal) => {
    const pk = getPeriodKey(goal.frequency || 'daily');
    return !!completions[pk]?.[user.id]?.[goal.id];
  };

  const getPillarProgress = (pillarId) => {
    const goals = myGoals[pillarId] || [];
    if (!goals.length) return 0;
    const done = goals.filter(isGoalDone).length;
    return Math.round((done / goals.length) * 100);
  };

  const isPillarComplete = (pillarId) => {
    const goals = myGoals[pillarId] || [];
    return goals.length > 0 && goals.every(isGoalDone);
  };

  const handleToggleGoal = async (pillar, goal) => {
    const pk = getPeriodKey(goal.frequency || 'daily');
    const wasOn = isGoalDone(goal);
    setSaving(p => ({ ...p, [goal.id]: true }));

    const path = `groups/${groupCode}/completions/${pk}/${user.id}/${goal.id}`;
    await set(ref(db, path), wasOn ? null : true);

    if (!wasOn) {
      setSparkle(p => ({ ...p, [goal.id]: true }));
      setTimeout(() => setSparkle(p => ({ ...p, [goal.id]: false })), 800);

      await addStar(user.id, groupCode);

      if (goal.isPublic !== false) {
        await addFeedEntry(groupCode, {
          userId: user.id, name: user.name, color: user.color,
          pillar: pillar.id, type: 'goal', text: goal.text,
        });
      }

      // Check if pillar now complete (need to re-read completions)
      const snap = await get(ref(db, `groups/${groupCode}/completions/${pk}/${user.id}`));
      const nowDone = snap.exists() ? snap.val() : {};
      const goals = myGoals[pillar.id] || [];
      const allNowDone = goals.length > 0 && goals.every(g => nowDone[g.id]);

      // Update daily stat for this pillar
      const anyDone = goals.some(g => nowDone[g.id]);
      await updateDailyStat(groupCode, user.id, pillar.id, anyDone);

      if (allNowDone) {
        await updateStreak(user.id, groupCode);
        if (goal.isPublic !== false) {
          await addFeedEntry(groupCode, {
            userId: user.id, name: user.name, color: user.color,
            pillar: pillar.id, type: 'pillar_complete',
            text: `completed all ${pillar.name} goals!`,
          });
        }
        await checkAndAwardTrophies(user.id, groupCode);
      }
    } else {
      // Unchecking — update daily stat
      const snap = await get(ref(db, `groups/${groupCode}/completions/${pk}/${user.id}`));
      const nowDone = snap.exists() ? snap.val() : {};
      const goals = myGoals[pillar.id] || [];
      const anyDone = goals.some(g => nowDone[g.id]);
      await updateDailyStat(groupCode, user.id, pillar.id, anyDone);
    }
    setSaving(p => { const n = { ...p }; delete n[goal.id]; return n; });
  };

  const handleAddGoal = async (pillarId) => {
    const text = (customInputs[pillarId] || '').trim();
    if (!text) return;
    const current = myGoals[pillarId] || [];
    if (current.length >= 7) { alert('Max 7 goals per pillar'); return; }
    const freq = newFreq[pillarId] || 'daily';
    const isPublic = newPublic[pillarId] !== false;
    const newGoal = { id: uuidv4(), text, frequency: freq, isPublic };
    await set(ref(db, `groups/${groupCode}/goals/${user.id}/${pillarId}`), [...current, newGoal]);
    setCustomInputs(p => ({ ...p, [pillarId]: '' }));
  };

  const handleAddSuggestion = async (pillarId, text) => {
    const current = myGoals[pillarId] || [];
    if (current.find(g => g.text === text)) return;
    if (current.length >= 7) { alert('Max 7 goals per pillar'); return; }
    const freq = newFreq[pillarId] || 'daily';
    const isPublic = newPublic[pillarId] !== false;
    await set(ref(db, `groups/${groupCode}/goals/${user.id}/${pillarId}`), [...current, { id: uuidv4(), text, frequency: freq, isPublic }]);
  };

  const handleRemoveGoal = async (pillarId, goalId) => {
    const updated = (myGoals[pillarId] || []).filter(g => g.id !== goalId);
    await set(ref(db, `groups/${groupCode}/goals/${user.id}/${pillarId}`), updated);
  };

  const allDone = PILLARS.every(p => isPillarComplete(p.id));

  return (
    <div className="screen">
      <ScriptureBanner />
      <div className="screen-header">
        <div className="header-top">
          <button className="home-back-btn" onClick={goHome}>← Home</button>
          <div style={{ marginLeft: 8 }}>
            <h2 className="screen-title">My Goals</h2>
            <p className="screen-sub">{today}</p>
          </div>
        </div>
      </div>

      <div className="goals-stats-bar">
        <div className="gstat"><span className="gstat-icon">⭐</span><span className="gstat-val">{stars}</span><span className="gstat-lbl">Stars</span></div>
        <div className="gstat"><span className="gstat-icon">🔥</span><span className="gstat-val">{streak}</span><span className="gstat-lbl">Streak</span></div>
        <div className="gstat"><span className="gstat-icon">🏅</span><span className="gstat-val">{PILLARS.filter(p => isPillarComplete(p.id)).length}/4</span><span className="gstat-lbl">Pillars</span></div>
      </div>

      {PILLARS.map(pillar => {
        const goals = myGoals[pillar.id] || [];
        const pct = getPillarProgress(pillar.id);
        const isComplete = isPillarComplete(pillar.id);
        const isOpen = expanded === pillar.id;

        return (
          <div key={pillar.id} className={`pillar-card ${isComplete ? 'complete' : ''} ${isOpen ? 'open' : ''}`}
            style={{ '--pc': pillar.color, '--pcl': pillar.colorLight, '--pcb': pillar.colorBorder }}>
            <button className="pillar-card-header" onClick={() => setExpanded(isOpen ? null : pillar.id)}>
              <div className="pillar-card-icon">{pillar.icon}</div>
              <div className="pillar-card-info">
                <div className="pillar-card-name">{pillar.name}</div>
                <div className="pillar-card-desc">{pillar.description}</div>
              </div>
              <div className="pillar-card-right">
                {isComplete ? <div className="pillar-done-badge">✓ Done</div>
                  : <div className="pillar-count">{goals.filter(isGoalDone).length}/{goals.length}</div>}
                <div className={`pillar-chevron ${isOpen ? 'up' : ''}`}>›</div>
              </div>
            </button>

            <div className="pillar-prog-bar"><div className="pillar-prog-fill" style={{ width: `${pct}%` }} /></div>

            {isOpen && (
              <div className="pillar-content">
                {goals.length > 0 && (
                  <div className="goal-list">
                    {goals.map(goal => {
                      const done = isGoalDone(goal);
                      return (
                        <div key={goal.id} className={`goal-item ${done ? 'done' : ''} ${sparkle[goal.id] ? 'sparkle' : ''}`}>
                          <button className="goal-check" onClick={() => handleToggleGoal(pillar, goal)} disabled={saving[goal.id]}>
                            {done ? '✓' : ''}
                          </button>
                          <div className="goal-item-body">
                            <span className="goal-text">{goal.text}</span>
                            <div className="goal-meta-row">
                              <span className="goal-freq-badge" style={{ background: pillar.colorLight, color: pillar.color }}>
                                {goal.frequency || 'daily'}
                              </span>
                              <span className={`goal-vis-badge ${goal.isPublic !== false ? 'pub' : 'priv'}`}>
                                {goal.isPublic !== false ? '👁 public' : '🔒 private'}
                              </span>
                            </div>
                          </div>
                          {done && <span className="goal-star">⭐</span>}
                          <button className="goal-remove" onClick={() => handleRemoveGoal(pillar.id, goal.id)}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {goals.length === 0 && <p className="empty-goals">No goals yet — add one below</p>}

                {/* New goal controls */}
                <div className="new-goal-controls">
                  <div className="new-goal-row1">
                    <select className="freq-select" value={newFreq[pillar.id] || 'daily'}
                      onChange={e => setNewFreq(p => ({ ...p, [pillar.id]: e.target.value }))}>
                      {FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    <button
                      className={`vis-toggle ${newPublic[pillar.id] === false ? 'priv' : 'pub'}`}
                      onClick={() => setNewPublic(p => ({ ...p, [pillar.id]: p[pillar.id] !== false ? false : true }))}>
                      {newPublic[pillar.id] === false ? '🔒 Private' : '👁 Public'}
                    </button>
                  </div>
                  <div className="add-goal-row">
                    <input type="text" placeholder="Add your own goal…"
                      value={customInputs[pillar.id] || ''}
                      onChange={e => setCustomInputs(p => ({ ...p, [pillar.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddGoal(pillar.id)}
                      className="goal-input" maxLength={60} />
                    <button className="add-goal-btn" style={{ background: pillar.color }} onClick={() => handleAddGoal(pillar.id)}>+</button>
                  </div>
                </div>

                <div className="suggestions-label">Suggestions:</div>
                <div className="suggestions-list">
                  {pillar.suggestions.filter(s => !goals.find(g => g.text === s)).map(s => (
                    <button key={s} className="suggestion-chip" style={{ '--sc': pillar.color, '--scbg': pillar.colorLight }}
                      onClick={() => handleAddSuggestion(pillar.id, s)}>+ {s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {allDone && (
        <div className="celebration-card">
          <div className="celebration-icon">🎉</div>
          <div className="celebration-text">Perfect Day!</div>
          <div className="celebration-sub">You completed all 4 pillars today. Amazing!</div>
        </div>
      )}
    </div>
  );
}
