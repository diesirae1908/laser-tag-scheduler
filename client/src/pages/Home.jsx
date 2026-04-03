import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSessions } from '../api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function SpotBar({ total, available }) {
  const filled = total - available;
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2.5 rounded-sm flex-1 min-w-[8px] max-w-[20px] transition-colors ${
            i < filled ? 'bg-laser-muted' : 'bg-laser-green'
          }`}
        />
      ))}
    </div>
  );
}

function SessionCard({ session }) {
  const available = parseInt(session.available_spots);
  const isFull = available <= 0;
  const isAlmostFull = available > 0 && available <= 3;
  const isInteract = session.payment_type === 'interact';

  return (
    <Link
      to={`/session/${session.id}`}
      className={`block group ${isFull ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
    >
      <div className="card p-6 hover:border-laser-cyan/40 hover:glow-cyan transition-all duration-300 h-full flex flex-col">
        <div className="flex justify-between items-start gap-3 mb-4">
          <h3 className="font-bold text-lg text-white leading-tight">{session.title}</h3>
          <span className={`shrink-0 ${isInteract ? 'badge-orange' : 'badge-green'}`}>
            {isInteract ? `💳 $${session.price}` : '💵 On-site'}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-4 text-center">📅</span>
            <span>{formatDate(session.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 text-center">🕐</span>
            <span>{session.time.slice(0, 5)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 text-center">📍</span>
            <span className="truncate">{session.location}</span>
          </div>
        </div>

        {session.description && (
          <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{session.description}</p>
        )}

        <div className="mt-auto pt-4 border-t border-laser-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">{session.total_spots} total spots</span>
            <span
              className={`text-sm font-semibold ${
                isFull
                  ? 'text-red-400'
                  : isAlmostFull
                  ? 'text-yellow-400'
                  : 'text-laser-green text-glow-green'
              }`}
            >
              {isFull ? 'FULL' : `${available} left`}
            </span>
          </div>
          {session.total_spots <= 20 && (
            <SpotBar total={session.total_spots} available={available} />
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSessions()
      .then((res) => setSessions(res.data))
      .catch(() => setError('Could not load sessions. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-laser-cyan animate-pulse text-lg">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-14">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          <span className="text-laser-cyan text-glow-cyan">LASER TAG</span>
          <br />
          <span className="text-white">SESSIONS</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Pick a session, grab your spot, and get ready to battle. 🔫
        </p>
      </div>

      {error && (
        <div className="text-center text-red-400 mb-8 card p-4">{error}</div>
      )}

      {sessions.length === 0 && !error ? (
        <div className="text-center py-24">
          <p className="text-6xl mb-6">🎯</p>
          <p className="text-2xl font-bold text-white mb-2">No sessions right now</p>
          <p className="text-gray-500">Check back soon — battles are being planned!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
