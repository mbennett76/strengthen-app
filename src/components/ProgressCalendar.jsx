import React, { useState } from 'react';
import { PILLARS } from '../pillars';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ProgressCalendar({ groupData, currentUserId }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedMemberId, setSelectedMemberId] = useState(currentUserId);

  const members = groupData?.members || {};
  const dailyStats = groupData?.dailyStats || {};

  const memberList = Object.entries(members).map(([id, m]) => ({ id, ...m }));

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const getDayStats = (day) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dailyStats[dateStr]?.[selectedMemberId] || null;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectedMember = members[selectedMemberId];

  return (
    <div className="calendar-wrapper">
      {/* Member selector */}
      <div className="cal-member-scroll">
        {memberList.map(m => (
          <button key={m.id} className={`cal-member-btn ${selectedMemberId === m.id ? 'active' : ''}`}
            onClick={() => setSelectedMemberId(m.id)}
            style={{ '--av': m.color }}>
            <div className="cal-member-av">{m.name[0]?.toUpperCase()}</div>
            <span className="cal-member-name">{m.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <div className="cal-month-title">{MONTHS[viewMonth]} {viewYear}</div>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
      </div>

      {selectedMember && (
        <div className="cal-viewing-label">
          <div className="cal-viewing-av" style={{ '--av': selectedMember.color }}>{selectedMember.name[0]?.toUpperCase()}</div>
          <span>{selectedMember.name}'s public progress</span>
        </div>
      )}

      {/* Day headers */}
      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}

        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="cal-day empty" />)}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const stats = getDayStats(day);
          const isToday = dateStr === today;
          const isFuture = dateStr > today;
          const pillarsComplete = stats ? PILLARS.filter(p => stats[p.id]).length : 0;

          return (
            <div key={day} className={`cal-day ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} ${!isFuture && pillarsComplete === 4 ? 'perfect' : ''}`}>
              <div className="cal-day-num">{day}</div>
              {!isFuture && stats && (
                <div className="cal-dots">
                  {PILLARS.map(p => (
                    <div key={p.id} className="cal-dot" style={{
                      background: stats[p.id] ? p.color : '#e5e7eb',
                      opacity: stats[p.id] ? 1 : 0.4
                    }} title={p.name} />
                  ))}
                </div>
              )}
              {!isFuture && !stats && day <= now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear() && (
                <div className="cal-no-data">·</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="cal-legend">
        {PILLARS.map(p => (
          <div key={p.id} className="cal-legend-item">
            <div className="cal-dot" style={{ background: p.color }} />
            <span>{p.name}</span>
          </div>
        ))}
        <div className="cal-legend-item">
          <div className="cal-dot" style={{ background: '#e5e7eb' }} />
          <span>Not done</span>
        </div>
      </div>
    </div>
  );
}
