import React, { useState } from 'react';
import { ref, set } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { PILLARS } from '../pillars';

export default function GoalImport({ user, targetGroupCode, sourceGroups, groupsData, db, onDone }) {
  const [selected, setSelected] = useState({}); // goalId -> goal object

  const toggle = (goal) => {
    setSelected(prev => {
      const n = { ...prev };
      if (n[goal.id]) delete n[goal.id];
      else n[goal.id] = goal;
      return n;
    });
  };

  const handleImport = async () => {
    if (Object.keys(selected).length === 0) { onDone(); return; }
    // Group selected goals by pillar
    const byPillar = {};
    Object.values(selected).forEach(g => {
      if (!byPillar[g.pillarId]) byPillar[g.pillarId] = [];
      byPillar[g.pillarId].push({ id: uuidv4(), text: g.text, frequency: g.frequency || 'daily', isPublic: g.isPublic !== false });
    });
    for (const [pillarId, goals] of Object.entries(byPillar)) {
      await set(ref(db, `groups/${targetGroupCode}/goals/${user.id}/${pillarId}`), goals);
    }
    onDone();
  };

  // Collect all public goals from source groups
  const allGoals = [];
  sourceGroups.forEach(code => {
    const data = groupsData[code];
    if (!data) return;
    const groupName = data.meta?.name || code;
    const userGoals = data.goals?.[user.id] || {};
    PILLARS.forEach(p => {
      const goals = userGoals[p.id] || [];
      goals.filter(g => g.isPublic !== false).forEach(g => {
        allGoals.push({ ...g, pillarId: p.id, pillarName: p.name, pillarIcon: p.icon, pillarColor: p.color, pillarBg: p.colorLight, groupName });
      });
    });
  });

  return (
    <div className="join-screen">
      <div className="join-form-header">
        <div className="join-logo small">✦</div>
        <h2>Bring Your Goals?</h2>
        <p>Select goals to carry into your new group, or skip to start fresh.</p>
      </div>

      {allGoals.length === 0 ? (
        <div style={{ padding: '24px 24px', textAlign: 'center', color: 'var(--text2)' }}>
          <p>No public goals found in your other groups.</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={onDone}>Start Fresh</button>
        </div>
      ) : (
        <div style={{ padding: '0 24px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {allGoals.map(goal => {
              const isOn = !!selected[goal.id];
              return (
                <button key={goal.id} className={`import-goal-row ${isOn ? 'selected' : ''}`}
                  style={{ '--gc': goal.pillarColor, '--gb': goal.pillarBg }}
                  onClick={() => toggle(goal)}>
                  <div className="import-check">{isOn ? '✓' : ''}</div>
                  <div className="import-pillar-icon">{goal.pillarIcon}</div>
                  <div className="import-goal-info">
                    <div className="import-goal-text">{goal.text}</div>
                    <div className="import-goal-meta">{goal.pillarName} · {goal.frequency || 'daily'} · from {goal.groupName}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-primary" onClick={handleImport}>
              {Object.keys(selected).length > 0 ? `Import ${Object.keys(selected).length} Goal${Object.keys(selected).length !== 1 ? 's' : ''}` : 'Skip — Start Fresh'}
            </button>
            <button className="btn-ghost" onClick={onDone}>Skip — Start Fresh</button>
          </div>
        </div>
      )}
    </div>
  );
}
