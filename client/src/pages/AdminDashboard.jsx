import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminSessions, deleteSession, updateSession } from '../api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await getAdminSessions();
      setSessions(res.data);
    } catch {
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? All bookings will be removed too.`)) return;
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert('Failed to delete session');
    }
  };

  const handleToggleActive = async (session) => {
    try {
      const res = await updateSession(session.id, {
        ...session,
        date: session.date.split('T')[0],
        time: session.time.slice(0, 5),
        is_active: !session.is_active,
      });
      setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...s, ...res.data } : s)));
    } catch {
      alert('Failed to update session');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-laser-cyan animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/admin/sessions/new">
          <button className="btn-primary">+ New Session</button>
        </Link>
      </div>

      {error && <p className="text-red-400 mb-6">{error}</p>}

      {sessions.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-xl font-bold text-white mb-2">No sessions yet</p>
          <p className="text-gray-500 mb-6">Create your first laser tag session</p>
          <Link to="/admin/sessions/new">
            <button className="btn-primary">Create Session</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const booked = parseInt(session.booked_spots) || 0;
            const fillPct = Math.round((booked / session.total_spots) * 100);
            const isInteract = session.payment_type === 'interact';

            return (
              <div
                key={session.id}
                className={`card p-5 transition-opacity ${!session.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white truncate">{session.title}</h3>
                      {!session.is_active && (
                        <span className="badge-gray">Inactive</span>
                      )}
                      <span className={isInteract ? 'badge-orange' : 'badge-green'}>
                        {isInteract ? `💳 $${session.price}` : '💵 On-site'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                      <span>📅 {formatDate(session.date)}</span>
                      <span>🕐 {session.time.slice(0, 5)}</span>
                      <span>📍 {session.location}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-xs bg-laser-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            fillPct >= 100
                              ? 'bg-red-500'
                              : fillPct >= 75
                              ? 'bg-yellow-400'
                              : 'bg-laser-green'
                          }`}
                          style={{ width: `${Math.min(fillPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 whitespace-nowrap">
                        {booked} / {session.total_spots} spots filled
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link to={`/admin/sessions/${session.id}/bookings`}>
                      <button className="px-3 py-2 text-sm border border-laser-border text-gray-400 rounded-lg hover:border-laser-cyan hover:text-laser-cyan transition-all">
                        Bookings ({parseInt(session.booking_count) || 0})
                      </button>
                    </Link>
                    <Link to={`/admin/sessions/${session.id}/edit`}>
                      <button className="px-3 py-2 text-sm border border-laser-border text-gray-400 rounded-lg hover:border-white hover:text-white transition-all">
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => handleToggleActive(session)}
                      className={`px-3 py-2 text-sm border rounded-lg transition-all ${
                        session.is_active
                          ? 'border-yellow-900 text-yellow-700 hover:text-yellow-500 hover:border-yellow-700'
                          : 'border-laser-green/30 text-laser-green hover:bg-laser-green/10'
                      }`}
                    >
                      {session.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(session.id, session.title)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
