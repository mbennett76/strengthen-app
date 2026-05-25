import React, { useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../App';
import { PILLARS, FREQUENCIES, getPeriodKey } from '../pillars';
import ScriptureBanner from './ScriptureBanner';

export default function PersonalGoals() {
  const { user, groupsData, db, today, goHome, addStar, syncGoalAcrossGroups } = useApp();
  const [expanded, setExpanded] = useState('spiritual');
  const [customInputs, setCustomInputs] = useState({});
  const [newFreq, setNewFreq] = useState({});
  const [saving, setSaving] = useState({});
  const [sparkle, setSparkle] = useState({});

  // Aggregate all goals from all groups for this user, keyed by pillar
  // Goals with same text in multiple groups are de-duped by text
  const getAggregatedGoals = (pillarId) => {
    const seen = new Map(); // text -> goal object (with source groups)
    (user.groups || []).forEach(code => {
      const goals = groupsData[code]?.goals?.[user.id]?.[pillarId] || [];
      goals.forEach(g => {
        if (seen.has(g.text)) {
          const existing = seen.get(g.text);
          if (!existing.sourceCodes.includes(code)) existing.sourceCodes.push(code);
        } else {
          seen.set(g.text, { ...g, sourceCodes: [code] });
        }
      });
    });
    return Array.from(seen.values());
  };

  // A goal is done if it's done in ANY of its source groups
  const isGoalDone = (goal) => {
    return (goal.sourceCodes || []).some(code => {
      const groupGoals = groupsData[code]?.goals?.[user.id]?.[goal.pillarId || ''] || [];
      const match = groupGoals.find(g => g.text === goal.text);
      if (!match) return false;
      const pk = getPeriodKey(match.frequency || 'daily');
      return !!groupsData[code]?.completions?.[pk]?.[user.id]?.[match.id];
    });
  };

  const handleToggleGoal = async (pillarId, goal) => {
    const isDone = isGoalDone({ ...goal, pillarId });
    setSaving(p => ({ ...p, [goal.id]: true }));

    if (!isDone) {
      setSparkle(p => ({ ...p, [goal.id]: true }));
      setTimeout(() => setSparkle(p => ({ ...p, [goal.id]: false })), 800);
    }

    // Mark in all source groups
    for (const code of (goal.sourceCodes || [])) {
      const groupGoals = groupsData[code]?.goals?.[user.id]?.[pillarId] || [];
      const match = groupGoals.find(g => g.text === goal.text);
      if (!match) continue;
      const pk = getPeriodKey(match.frequency || 'daily');
      await set(ref(db, `groups/${code}/completions/${pk}/${user.id}/${match.id}`), isDone ? null : true);
      if (!isDone) await addStar(user.id, code);
    }

    // Also sync to any other groups that have same goal text
    await syncGoalAcrossGroups(goal.text, pillarId, !isDone, null);

    setSaving(p => { const n = { ...p }; delete n[goal.id]; return n; });
  };

  const handleAddGoal = async (pillarId) => {
    const text = (customInputs[pillarId] || '').trim();
    if (!text) return;
    const freq = newFreq[pillarId] || 'daily';
    // Add to ALL groups the user is in
    for (const code of (user.groups || [])) {
      const current = groupsData[code]?.goals?.[user.id]?.[pillarId] || [];
      if (current.find(g => g.text === text)) continue;
      if (current.length >= 7) continue;
      await set(ref(db, `groups/${code}/goals/${user.id}/${pillarId}`),
        [...current, { id: uuidv4(), text, frequency: freq, isPublic: false }]);
    }
    setCustomInputs(p => ({ ...p, [pillarId]: '' }));
  };

  const getPillarProgress = (pillarId) => {
    const goals = getAggregatedGoals(pillarId);
    if (!goals.length) return 0;
    const done = goals.filter(g => isGoalDone({ ...g, pillarId })).length;
    return Math.round((done / goals.length) * 100);
  };

  const isPillarComplete = (pillarId) => {
    const goals = getAggregatedGoals(pillarId);
    return goals.length > 0 && goals.every(g => isGoalDone({ ...g, pillarId }));
  };

  return (
    <div className="screen">
      <ScriptureBanner />
      <div className="screen-header">
        <div className="header-top">
          <button className="home-back-btn" onClick={goHome}>← Home</button>
          <h2 className="screen-title">My Personal Goals</h2>
        </div>
        <p className="screen-sub">All goals across all your groups</p>
      </div>

      {/* Summary */}
      <div className="goals-stats-bar">
        {PILLARS.map(p => {
          const pct = getPillarProgress(p.id);
          const done = isPillarComplete(p.id);
          return (
            <div key={p.id} className="gstat" style={{ '--pc': p.color }}>
              <span className="gstat-icon" style={{ color: p.color }}>{p.icon}</span>
              <span className="gstat-val" style={{ color: p.color }}>{pct}%</span>
              <span className="gstat-lbl">{done ? '✓' : p.name.split('/')[0]}</span>
            </div>
          );
        })}
      </div>

      {/* Pillar sections */}
      {PILLARS.map(pillar => {
        const goals = getAggregatedGoals(pillar.id).map(g => ({ ...g, pillarId: pillar.id }));
        const pct = getPillarProgress(pillar.id);
        const isComplete = isPillarComplete(pillar.id);
        const isOpen = expanded === pillar.id;

        return (
          <div key={pillar.id}
            className={`pillar-card ${isComplete ? 'complete' : ''} ${isOpen ? 'open' : ''}`}
            style={{ '--pc': pillar.color, '--pcl': pillar.colorLight, '--pcb': pillar.colorBorder }}>

            <button className="pillar-card-header" onClick={() => setExpanded(isOpen ? null : pillar.id)}>
              <div className="pillar-card-icon">{pillar.icon}</div>
              <div className="pillar-card-info">
                <div className="pillar-card-name">{pillar.name}</div>
                <div className="pillar-card-desc">{goals.length} goal{goals.length !== 1 ? 's' : ''} across {(user.groups||[]).length} group{(user.groups||[]).length !== 1 ? 's' : ''}</div>
              </div>
              <div className="pillar-card-right">
                {isComplete
                  ? <div className="pillar-done-badge">✓ Done</div>
                  : <div className="pillar-count">{goals.filter(g => isGoalDone(g)).length}/{goals.length}</div>}
                <div className={`pillar-chevron ${isOpen ? 'up' : ''}`}>›</div>
              </div>
            </button>

            <div className="pillar-prog-bar">
              <div className="pillar-prog-fill" style={{ width: `${pct}%` }} />
            </div>

            {isOpen && (
              <div className="pillar-content">
                {goals.length === 0 && (
                  <p className="empty-goals">No goals yet — add one below</p>
                )}
                {goals.length > 0 && (
                  <div className="goal-list">
                    {goals.map(goal => {
                      const done = isGoalDone(goal);
                      return (
                        <div key={goal.id}
                          className={`goal-item ${done ? 'done' : ''} ${sparkle[goal.id] ? 'sparkle' : ''}`}>
                          <button className="goal-check"
                            onClick={() => handleToggleGoal(pillar.id, goal)}
                            disabled={saving[goal.id]}>
                            {done ? '✓' : ''}
                          </button>
                          <div className="goal-item-body">
                            <span className="goal-text">{goal.text}</span>
                            <div className="goal-meta-row">
                              <span className="goal-freq-badge"
                                style={{ background: pillar.colorLight, color: pillar.color }}>
                                {goal.frequency || 'daily'}
                              </span>
                              <span className="goal-vis-badge priv">
                                {goal.sourceCodes?.length > 1
                                  ? `${goal.sourceCodes.length} groups`
                                  : groupsData[goal.sourceCodes?.[0]]?.meta?.name || 'group'}
                              </span>
                            </div>
                          </div>
                          {done && <span className="goal-star">⭐</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add personal goal */}
                <div className="new-goal-controls">
                  <div className="new-goal-row1">
                    <select className="freq-select"
                      value={newFreq[pillar.id] || 'daily'}
                      onChange={e => setNewFreq(p => ({ ...p, [pillar.id]: e.target.value }))}>
                      {FREQUENCIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    <span className="vis-toggle priv">🔒 Private</span>
                  </div>
                  <div className="add-goal-row">
                    <input type="text" placeholder="Add a personal goal…"
                      value={customInputs[pillar.id] || ''}
                      onChange={e => setCustomInputs(p => ({ ...p, [pillar.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddGoal(pillar.id)}
                      className="goal-input" maxLength={60} />
                    <button className="add-goal-btn"
                      style={{ background: pillar.color }}
                      onClick={() => handleAddGoal(pillar.id)}>+</button>
                  </div>
                </div>

                <div className="suggestions-label">Suggestions:</div>
                <div className="suggestions-list">
                  {pillar.suggestions
                    .filter(s => !goals.find(g => g.text === s))
                    .map(s => (
                      <button key={s} className="suggestion-chip"
                        style={{ '--sc': pillar.color, '--scbg': pillar.colorLight }}
                        onClick={() => {
                          setCustomInputs(p => ({ ...p, [pillar.id]: s }));
                          handleAddGoal(pillar.id);
                        }}>+ {s}</button>
                    ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
