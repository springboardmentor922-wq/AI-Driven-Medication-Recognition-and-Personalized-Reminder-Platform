
import { useEffect, useState } from 'react';
import { CalendarDays, Check, Clock3, X } from 'lucide-react';
import api from '../services/api';

export default function Schedule({ patientId = '', readOnly = false }) {
  const [meds, setMeds] = useState([]);
  const [message, setMessage] = useState('');

  async function load() {
    const { data } = await api.get('/medicines', {
      params: patientId ? { patientId } : {}
    });
    setMeds(data);
  }

  useEffect(() => {
    load().catch(() => setMessage('Unable to load schedule'));
  }, [patientId]);

  async function mark(m, status, time) {
    try {
      const [hour, minute] = time.split(':').map(Number);

      if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
        setMessage('Add a valid reminder time first.');
        return;
      }

      const scheduledAt = new Date();
      scheduledAt.setHours(hour, minute, 0, 0);

      await api.post('/doses', {
        medicineId: m._id,
        status,
        scheduledAt: scheduledAt.toISOString()
      });

      setMessage(`${m.name}: marked ${status}`);
      await load();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Could not save dose');
    }
  }

  const slots = meds.flatMap(m =>
    (m.schedule?.length ? m.schedule : ['Not scheduled']).map(time => ({
      m,
      time
    }))
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">DAILY ROUTINE</span>
          <h1>
            Dose schedule<span className="period">.</span>
          </h1>
          <p>Record each dose to keep your history up to date.</p>
        </div>

        <div className="date-chip">
          <CalendarDays size={17} />
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          })}
        </div>
      </div>

      {message && <div className="notice">{message}</div>}

      {readOnly && (
        <div className="hint-box">
          Caregiver view · Dose actions are disabled.
          The patient controls dose records.
        </div>
      )}

      <div className="panel schedule-panel">
        <div className="panel-head">
          <div>
            <h3>Medication plan</h3>
            <p>Record a dose after taking or missing it.</p>
          </div>
          <span className="tiny-pill">{slots.length} ITEMS</span>
        </div>

        {!slots.length ? (
          <div className="empty-state">
            Schedule is empty. Add medicines and reminder times first.
          </div>
        ) : (
          slots.map(({ m, time }, i) => (
            <div className="schedule-row" key={m._id + time + i}>
              <div className="time-block">
                <Clock3 size={15} />
                {time}
              </div>

              <div className="medicine-dot">
                <CalendarDays size={16} />
              </div>

              <div className="medicine-info">
                <b>{m.name}</b>
                <small>
                  {m.dosage || 'Dosage not specified'} · {m.category}
                </small>
              </div>

              {!readOnly && (
                <div className="schedule-actions">
                  <button
                    className="taken-btn"
                    onClick={() => mark(m, 'taken', time)}
                  >
                    <Check size={15} /> Taken
                  </button>

                  <button
                    className="missed-btn"
                    onClick={() => mark(m, 'missed', time)}
                  >
                    <X size={15} /> Missed
                  </button>

                  <button
                    className="snooze-btn"
                    onClick={() => mark(m, 'snoozed', time)}
                  >
                    Snooze
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="hint-box">
        Missed doses are automatically recorded after the configured
        grace period. Email alerts require SMTP settings and the backend
        must remain running.
      </div>
    </>
  );
}
