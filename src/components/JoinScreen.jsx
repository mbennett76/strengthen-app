import React, { useState } from 'react';
import { db } from '../firebase';
import { ref, get, set } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import { AVATAR_COLORS, PILLARS, generateGroupCode } from '../pillars';
import GoalImport from './GoalImport';

export default function JoinScreen({ onJoin, existingUser, addGroupToUser, groupsData, onCancel }) {
  const [mode, setMode] = useState('welcome');
  const [name, setName] = useState(existingUser?.name || '');
  const [color, setColor] = useState(existingUser?.color || AVATAR_COLORS[0]);
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingGroup, setPendingGroup] = useState(null); // {code, name} — awaiting import decision
  const isReturning = !!existingUser?.id;

  const hasExistingGoals = () => {
    if (!existingUser?.groups?.length) return false;
    return existingUser.groups.some(code => {
      const data = groupsData[code];
      if (!data) return false;
      const goals = data.goals?.[existingUser.id];
      return goals && Object.values(goals).some(arr => arr?.length > 0);
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!groupName.trim()) { setError('Please enter a group name.'); return; }
    setLoading(true); setError('');
    try {
      const code = generateGroupCode();
      const userId = existingUser?.id || uuidv4();
      await set(ref(db, `groups/${code}`), {
        meta: { name: groupName.trim(), createdByName: name.trim(), createdAt: Date.now() },
        members: { [userId]: { name: name.trim(), color, joinedAt: Date.now() } }
      });
      const newUser = {
        id: userId, name: name.trim(), color,
        groups: [...(existingUser?.groups || []), code],
        currentGroup: code,
      };
      if (isReturning && hasExistingGoals()) {
        setPendingGroup({ code, newUser });
      } else {
        onJoin(newUser);
      }
    } catch (e) { setError('Could not create group. Check your Firebase connection.'); }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    const code = groupCode.trim().toUpperCase();
    if (code.length !== 6) { setError('Group code must be 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      const snap = await get(ref(db, `groups/${code}`));
      if (!snap.exists()) { setError('Group not found. Check the code.'); setLoading(false); return; }
      const data = snap.val();
      if (Object.keys(data.members || {}).length >= 20) { setError('This group is full (max 20 members).'); setLoading(false); return; }
      const userId = existingUser?.id || uuidv4();
      await set(ref(db, `groups/${code}/members/${userId}`), { name: name.trim(), color, joinedAt: Date.now() });
      const newUser = {
        id: userId, name: name.trim(), color,
        groups: [...(existingUser?.groups || []), code],
        currentGroup: code,
      };
      if (isReturning && hasExistingGoals()) {
        setPendingGroup({ code, newUser });
      } else {
        onJoin(newUser);
      }
    } catch (e) { setError('Could not join group. Check your connection.'); }
    setLoading(false);
  };

  if (pendingGroup) {
    return (
      <GoalImport
        user={pendingGroup.newUser}
        targetGroupCode={pendingGroup.code}
        sourceGroups={existingUser.groups.filter(c => c !== pendingGroup.code)}
        groupsData={groupsData}
        db={db}
        onDone={() => onJoin(pendingGroup.newUser)}
      />
    );
  }

  if (mode === 'welcome') return (
    <div className="join-screen">
      <div className="join-hero">
        <div className="join-logo">✦</div>
        <h1 className="join-title">Strengthen</h1>
        <p className="join-subtitle">A goal & accountability app built on the<br /><em>For the Strength of Youth</em> framework</p>
        <div className="join-pillars-row">
          {PILLARS.map(p => (
            <div key={p.id} className="join-pillar-chip" style={{ '--chip-color': p.color, '--chip-bg': p.colorLight }}>
              <span>{p.icon}</span><span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="join-actions">
        <button className="btn-primary" onClick={() => setMode('create')}>Create a Group</button>
        <button className="btn-secondary" onClick={() => setMode('join')}>Join a Group</button>
        {(isReturning || onCancel) && (
          <button className="btn-ghost" onClick={onCancel || (() => setMode('welcome'))}>← Back to Home</button>
        )}
      </div>
      <p className="join-verse">"And Jesus increased in wisdom and stature, and in favour with God and man." — Luke 2:52</p>
    </div>
  );

  return (
    <div className="join-screen">
      <button className="back-btn" onClick={() => mode === 'welcome' ? (onCancel && onCancel()) : (setMode('welcome'), setError(''))}>← Back</button>
      <div className="join-form-header">
        <div className="join-logo small">✦</div>
        <h2>{mode === 'create' ? 'Create a Group' : 'Join a Group'}</h2>
        <p>{mode === 'create' ? 'Start your accountability circle' : 'Enter your group code'}</p>
      </div>
      <div className="join-form">
        {!isReturning && (
          <div className="form-group">
            <label>Your Name</label>
            <input type="text" placeholder="e.g. Sarah M." value={name} onChange={e => setName(e.target.value)} maxLength={20} className="form-input" />
          </div>
        )}
        {!isReturning && (
          <div className="form-group">
            <label>Choose Your Color</label>
            <div className="color-picker">
              {AVATAR_COLORS.map(c => (
                <button key={c} className={`color-swatch ${color === c ? 'selected' : ''}`} style={{ '--sw': c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        )}
        {!isReturning && (
          <div className="avatar-preview">
            <div className="avatar" style={{ '--av': color }}>{name ? name[0].toUpperCase() : '?'}</div>
            <span>{name || 'Your Name'}</span>
          </div>
        )}
        {mode === 'create' && (
          <div className="form-group">
            <label>Group Name</label>
            <input type="text" placeholder="e.g. Ward Youth 2025" value={groupName} onChange={e => setGroupName(e.target.value)} maxLength={40} className="form-input" />
          </div>
        )}
        {mode === 'join' && (
          <div className="form-group">
            <label>Group Code</label>
            <input type="text" placeholder="e.g. ABC123" value={groupCode} onChange={e => setGroupCode(e.target.value.toUpperCase())} maxLength={6} className="form-input code-input" />
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        <button className="btn-primary" onClick={mode === 'create' ? handleCreate : handleJoin} disabled={loading}>
          {loading ? 'Please wait…' : mode === 'create' ? 'Create Group' : 'Join Group'}
        </button>
      </div>
    </div>
  );
}
