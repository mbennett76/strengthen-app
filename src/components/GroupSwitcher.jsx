import React from 'react';
import { useApp } from '../App';

export default function GroupSwitcher() {
  const { user, groupsData, setShowSwitcher, switchGroup, handleLeaveGroup, setScreen } = useApp();

  return (
    <div className="switcher-overlay" onClick={() => setShowSwitcher(false)}>
      <div className="switcher-panel" onClick={e => e.stopPropagation()}>
        <div className="switcher-header">
          <h3>Your Groups</h3>
          <button className="icon-btn" onClick={() => setShowSwitcher(false)}>✕</button>
        </div>

        <div className="switcher-list">
          {(user.groups || []).map(code => {
            const data = groupsData[code];
            const name = data?.meta?.name || code;
            const memberCount = Object.keys(data?.members || {}).length;
            const isCurrent = code === user.currentGroup;
            return (
              <div key={code} className={`switcher-row ${isCurrent ? 'current' : ''}`}>
                <button className="switcher-group-btn" onClick={() => switchGroup(code)}>
                  <div className="switcher-group-icon">{name[0]?.toUpperCase()}</div>
                  <div className="switcher-group-info">
                    <div className="switcher-group-name">{name}</div>
                    <div className="switcher-group-meta">{memberCount} member{memberCount !== 1 ? 's' : ''} · {code}</div>
                  </div>
                  {isCurrent && <span className="switcher-active-badge">Active</span>}
                </button>
                {!isCurrent && (
                  <button className="switcher-leave-btn" onClick={() => {
                    if (window.confirm(`Leave "${name}"?`)) handleLeaveGroup(code);
                  }}>Leave</button>
                )}
              </div>
            );
          })}
        </div>

        <div className="switcher-footer">
          <button className="btn-secondary" onClick={() => { setShowSwitcher(false); setScreen('join-new'); }}>
            + Join or Create Another Group
          </button>
        </div>
      </div>
    </div>
  );
}
