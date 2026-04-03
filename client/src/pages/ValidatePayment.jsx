import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ValidatePayment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ booking_id: '', last_name: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/bookings/${form.booking_id}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_name: form.last_name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Booking not found. Check your ID and last name.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
      >
        ← Back to sessions
      </button>

      <div className="card p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">💳</span>
          <h1 className="text-2xl font-bold text-white mt-4 mb-2">Validate Payment</h1>
          <p className="text-gray-400 text-sm">
            Already sent your Interac e-Transfer? Confirm it here with your booking ID and last
            name.
          </p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-laser-green mb-2">Payment Confirmed!</h2>
            <p className="text-gray-400 mb-8">
              Your spot is locked in. See you on the battlefield!
            </p>
            <button onClick={() => navigate('/')} className="text-laser-cyan hover:underline">
              Back to sessions
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Booking ID *</label>
              <input
                type="number"
                value={form.booking_id}
                onChange={set('booking_id')}
                required
                placeholder="e.g. 42"
                min="1"
                className="input-field"
              />
              <p className="text-gray-600 text-xs mt-1">
                You received this right after booking
              </p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Last Name *</label>
              <input
                type="text"
                value={form.last_name}
                onChange={set('last_name')}
                required
                placeholder="Navilloz"
                className="input-field"
              />
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-laser-green/10 border border-laser-green text-laser-green
                rounded-lg hover:bg-laser-green/20 transition-all font-semibold disabled:opacity-50"
            >
              {loading ? 'Confirming...' : "✓ Confirm I've Sent the Payment"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
