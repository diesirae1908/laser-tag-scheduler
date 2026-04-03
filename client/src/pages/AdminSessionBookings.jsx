import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getAdminSessions, getSessionBookings, updateBooking, deleteBooking } from '../api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', cls: 'badge-green' },
  validated: { label: 'Paid ✓', cls: 'badge-green' },
  placeholder: { label: 'Pending payment', cls: 'badge-yellow' },
  cancelled: { label: 'Cancelled', cls: 'badge-gray' },
};

export default function AdminSessionBookings() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getAdminSessions(), getSessionBookings(id)])
      .then(([sessionsRes, bookingsRes]) => {
        const s = sessionsRes.data.find((s) => s.id === parseInt(id));
        setSession(s || null);
        setBookings(bookingsRes.data);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const res = await updateBooking(bookingId, { payment_status: newStatus });
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? res.data : b)));
    } catch {
      alert('Failed to update booking');
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Remove this booking? This will free up their spot(s).')) return;
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch {
      alert('Failed to delete booking');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-laser-cyan animate-pulse">Loading...</div>
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => b.payment_status !== 'cancelled');
  const totalBooked = activeBookings.reduce((sum, b) => sum + parseInt(b.spots_count), 0);
  const validatedSpots = bookings
    .filter((b) => b.payment_status === 'validated')
    .reduce((sum, b) => sum + parseInt(b.spots_count), 0);
  const pendingSpots = bookings
    .filter((b) => b.payment_status === 'placeholder')
    .reduce((sum, b) => sum + parseInt(b.spots_count), 0);
  const confirmedSpots = bookings
    .filter((b) => b.payment_status === 'confirmed')
    .reduce((sum, b) => sum + parseInt(b.spots_count), 0);

  const isInteract = session?.payment_type === 'interact';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
      >
        ← Back to dashboard
      </button>

      {session && (
        <div className="card p-6 mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{session.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span>📅 {formatDate(session.date)}</span>
                <span>🕐 {session.time.slice(0, 5)}</span>
                <span>📍 {session.location}</span>
              </div>
            </div>
            <Link to={`/admin/sessions/${id}/edit`}>
              <button className="btn-secondary text-sm py-2">Edit session</button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 pt-4 border-t border-laser-border text-center">
            <div>
              <p className="text-2xl font-bold text-white">{totalBooked}</p>
              <p className="text-xs text-gray-500 mt-0.5">Spots booked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-400">
                {(session.total_spots || 0) - totalBooked}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Available</p>
            </div>
            {isInteract ? (
              <>
                <div>
                  <p className="text-2xl font-bold text-laser-green">{validatedSpots}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Paid & validated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{pendingSpots}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pending payment</p>
                </div>
                {validatedSpots > 0 && session.price && (
                  <div>
                    <p className="text-2xl font-bold text-laser-cyan">
                      ${(validatedSpots * parseFloat(session.price)).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Collected</p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <p className="text-2xl font-bold text-laser-green">{confirmedSpots}</p>
                <p className="text-xs text-gray-500 mt-0.5">Confirmed</p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {bookings.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-xl font-bold text-white mb-2">No bookings yet</p>
          <p className="text-gray-500">Share the session link to start collecting registrations</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-laser-border">
                  {['ID', 'Name', 'WhatsApp', 'Spots', 'Status', 'Booked at', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-gray-500 text-xs font-semibold uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-laser-border">
                {bookings.map((booking) => {
                  const statusCfg = STATUS_CONFIG[booking.payment_status] || {
                    label: booking.payment_status,
                    cls: 'badge-gray',
                  };

                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-500 font-mono text-sm">
                        #{booking.id}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-white font-medium">
                          {booking.first_name} {booking.last_name}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-sm">{booking.whatsapp}</td>
                      <td className="py-4 px-4 text-gray-300 font-medium">
                        {booking.spots_count}
                      </td>
                      <td className="py-4 px-4">
                        <span className={statusCfg.cls}>{statusCfg.label}</span>
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-sm whitespace-nowrap">
                        {new Date(booking.created_at).toLocaleString('en-CA', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {isInteract && booking.payment_status === 'placeholder' && (
                            <button
                              onClick={() => handleStatusChange(booking.id, 'validated')}
                              className="text-xs px-2.5 py-1.5 border border-laser-green/40 text-laser-green rounded-lg hover:bg-laser-green/10 transition-all whitespace-nowrap"
                            >
                              Mark Paid
                            </button>
                          )}
                          {isInteract && booking.payment_status === 'validated' && (
                            <button
                              onClick={() => handleStatusChange(booking.id, 'placeholder')}
                              className="text-xs px-2.5 py-1.5 border border-yellow-800 text-yellow-600 rounded-lg hover:bg-yellow-400/10 transition-all whitespace-nowrap"
                            >
                              Unmark
                            </button>
                          )}
                          {booking.payment_status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              className="text-xs px-2.5 py-1.5 border border-laser-border text-gray-500 rounded-lg hover:border-gray-600 hover:text-gray-300 transition-all"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="text-xs px-2.5 py-1.5 border border-red-950 text-red-700 rounded-lg hover:border-red-800 hover:text-red-500 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
