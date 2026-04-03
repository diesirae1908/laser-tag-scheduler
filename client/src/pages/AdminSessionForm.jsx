import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createSession, updateSession, getAdminSessions } from '../api';

const defaultForm = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  total_spots: 10,
  payment_type: 'at_location',
  price: '',
  is_active: true,
};

export default function AdminSessionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEditing) return;
    getAdminSessions()
      .then((res) => {
        const session = res.data.find((s) => s.id === parseInt(id));
        if (session) {
          setForm({
            title: session.title,
            description: session.description || '',
            date: session.date.split('T')[0],
            time: session.time.slice(0, 5),
            location: session.location,
            total_spots: session.total_spots,
            payment_type: session.payment_type,
            price: session.price || '',
            is_active: session.is_active,
          });
        }
      })
      .catch(() => setError('Failed to load session'))
      .finally(() => setFetching(false));
  }, [id, isEditing]);

  const set = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.payment_type === 'interact' && (!form.price || parseFloat(form.price) <= 0)) {
      setError('Please enter a valid price for Interac sessions');
      return;
    }

    setLoading(true);
    const data = {
      ...form,
      total_spots: parseInt(form.total_spots),
      price: form.payment_type === 'interact' ? parseFloat(form.price) : null,
    };

    try {
      if (isEditing) {
        await updateSession(id, data);
      } else {
        await createSession(data);
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-laser-cyan animate-pulse">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
      >
        ← Back to dashboard
      </button>

      <div className="card p-8">
        <h1 className="text-2xl font-bold text-white mb-8">
          {isEditing ? 'Edit Session' : 'Create New Session'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Session Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              required
              placeholder="Friday Night Laser Battle"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Any extra info players should know..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={set('date')}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Time *</label>
              <input
                type="time"
                value={form.time}
                onChange={set('time')}
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Location *</label>
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              required
              placeholder="Zone Laser, 123 Main St, Montreal"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Total Spots *</label>
            <input
              type="number"
              value={form.total_spots}
              onChange={set('total_spots')}
              required
              min={1}
              max={200}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Payment Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, payment_type: 'at_location' })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  form.payment_type === 'at_location'
                    ? 'border-laser-green bg-laser-green/10 text-laser-green'
                    : 'border-laser-border text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-semibold mb-1">💵 Pay at Location</div>
                <div className="text-xs opacity-70 leading-relaxed">
                  Everyone pays at the laser tag place. One-step booking.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, payment_type: 'interact' })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  form.payment_type === 'interact'
                    ? 'border-laser-orange bg-laser-orange/10 text-laser-orange'
                    : 'border-laser-border text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-semibold mb-1">💳 Interac e-Transfer</div>
                <div className="text-xs opacity-70 leading-relaxed">
                  Players send you payment in advance to lock in their spot.
                </div>
              </button>
            </div>
          </div>

          {form.payment_type === 'interact' && (
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Price per Spot ($) *</label>
              <input
                type="number"
                value={form.price}
                onChange={set('price')}
                required
                min={0.01}
                step={0.01}
                placeholder="25.00"
                className="input-field"
              />
            </div>
          )}

          {isEditing && (
            <div className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  form.is_active ? 'bg-laser-green' : 'bg-laser-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    form.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-gray-400 text-sm">
                Session is <span className={form.is_active ? 'text-laser-green' : 'text-gray-500'}>
                  {form.is_active ? 'active' : 'inactive'}
                </span>{' '}
                — {form.is_active ? 'visible to players' : 'hidden from public'}
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-950/30 border border-red-900 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading
                ? 'Saving...'
                : isEditing
                ? 'Save Changes'
                : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
