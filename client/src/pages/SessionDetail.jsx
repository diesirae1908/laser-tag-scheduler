import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, createBooking, validatePayment } from '../api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function SessionInfo({ session }) {
  const available = parseInt(session.available_spots);
  const isFull = available <= 0;
  const isInteract = session.payment_type === 'interact';

  return (
    <div className="card p-6 mb-8">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <h1 className="text-3xl font-bold text-white">{session.title}</h1>
        <span className={isInteract ? 'badge-orange' : 'badge-green'}>
          {isInteract ? `💳 Interac — $${session.price} / spot` : '💵 Pay at the laser tag place'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-5">
        <div>
          <p className="text-gray-500 mb-1">Date</p>
          <p className="text-white font-medium">{formatDate(session.date)}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">Time</p>
          <p className="text-white font-medium">{session.time.slice(0, 5)}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">Location</p>
          <p className="text-white font-medium">{session.location}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">Availability</p>
          <p
            className={`font-semibold ${
              isFull ? 'text-red-400' : available <= 3 ? 'text-yellow-400' : 'text-laser-green'
            }`}
          >
            {isFull ? 'FULLY BOOKED' : `${available} / ${session.total_spots} left`}
          </p>
        </div>
      </div>

      {session.description && <p className="text-gray-400 text-sm">{session.description}</p>}
    </div>
  );
}

function BookingForm({ session, onSuccess }) {
  const available = parseInt(session.available_spots);
  const maxSpots = Math.min(available, 10);
  const isInteract = session.payment_type === 'interact';

  const [step, setStep] = useState('form');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    whatsapp: '',
    spots_count: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const totalPrice = isInteract ? parseFloat(session.price) * form.spots_count : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isInteract && step === 'form') {
      setStep('confirm');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createBooking({
        session_id: session.id,
        ...form,
        spots_count: parseInt(form.spots_count),
      });
      onSuccess(res.data.booking, session);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  if (step === 'confirm') {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-1">Confirm your booking</h2>
        <p className="text-gray-400 text-sm mb-6">Review your details before reserving your spot</p>

        <div className="bg-laser-dark rounded-lg p-4 mb-5 space-y-3 text-sm">
          {[
            ['Name', `${form.first_name} ${form.last_name}`],
            ['WhatsApp', form.whatsapp],
            ['Spots', `${form.spots_count} spot${form.spots_count > 1 ? 's' : ''}`],
            ['Total to send', `$${totalPrice.toFixed(2)} via Interac`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500">{label}</span>
              <span className={label === 'Total to send' ? 'text-laser-orange font-bold' : 'text-white'}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-laser-orange/5 border border-laser-orange/20 rounded-lg p-4 mb-6 text-sm">
          <p className="text-laser-orange font-semibold mb-2">⚡ Payment Info</p>
          <p className="text-gray-300">
            After reserving, you'll need to send{' '}
            <span className="text-white font-bold">${totalPrice.toFixed(2)}</span> via Interac
            e-Transfer to{' '}
            <span className="text-laser-cyan font-mono">lucasnavilloz@gmail.com</span>
          </p>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="btn-secondary flex-1">
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {submitting ? 'Reserving...' : 'Reserve My Spot'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-white mb-1">Book your spot</h2>
      <p className="text-gray-400 text-sm mb-6">
        {isInteract
          ? "Fill in your details — you'll send payment after reserving"
          : 'Fill in your details to confirm your spot'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">First Name *</label>
            <input
              type="text"
              value={form.first_name}
              onChange={set('first_name')}
              required
              placeholder="Lucas"
              className="input-field"
            />
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
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1.5">WhatsApp Number *</label>
          <input
            type="tel"
            value={form.whatsapp}
            onChange={set('whatsapp')}
            required
            placeholder="+1 514 555 0100"
            className="input-field"
          />
          <p className="text-gray-600 text-xs mt-1">Include country code (e.g. +1 for Canada)</p>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1.5">Number of Spots *</label>
          <select
            value={form.spots_count}
            onChange={(e) => setForm({ ...form, spots_count: parseInt(e.target.value) })}
            className="input-field"
          >
            {Array.from({ length: maxSpots }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'spot (just me)' : `spots (me + ${n - 1} friend${n > 2 ? 's' : ''})`}
                {isInteract ? ` — $${(parseFloat(session.price) * n).toFixed(2)}` : ''}
              </option>
            ))}
          </select>
          {form.spots_count > 1 && (
            <p className="text-gray-500 text-xs mt-1">
              You're booking for yourself and {form.spots_count - 1} other{form.spots_count > 2 ? 's' : ''}
            </p>
          )}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-laser-cyan/10 border border-laser-cyan text-laser-cyan rounded-lg
            hover:bg-laser-cyan/20 transition-all duration-200 font-bold text-lg disabled:opacity-50 glow-cyan"
        >
          {submitting
            ? 'Booking...'
            : isInteract
            ? `Continue → Review Payment ($${totalPrice.toFixed(2)})`
            : `Book ${form.spots_count} Spot${form.spots_count > 1 ? 's' : ''}`}
        </button>
      </form>
    </div>
  );
}

function BookingSuccess({ booking, session, onValidate }) {
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(booking.payment_status === 'validated');
  const [error, setError] = useState(null);
  const isInteract = session.payment_type === 'interact';
  const totalPrice = isInteract ? parseFloat(session.price) * parseInt(booking.spots_count) : 0;

  const handleValidate = async () => {
    setValidating(true);
    setError(null);
    try {
      await validatePayment(booking.id, booking.last_name);
      setValidated(true);
    } catch (err) {
      setError('Could not confirm. Try the "Validate Payment" page with your booking ID.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="card border-laser-green/30 glow-green p-8 text-center">
      <div className="text-6xl mb-4">{validated ? '🎉' : '✅'}</div>
      <h2 className={`text-2xl font-bold mb-2 ${validated ? 'text-laser-green' : 'text-white'}`}>
        {validated
          ? 'All set! See you on the battlefield!'
          : isInteract
          ? 'Spot reserved!'
          : 'Booking confirmed!'}
      </h2>
      <p className="text-gray-400 mb-1">
        {booking.spots_count} spot{booking.spots_count > 1 ? 's' : ''} for{' '}
        <span className="text-white font-medium">
          {booking.first_name} {booking.last_name}
        </span>
      </p>
      <div className="inline-block bg-laser-dark rounded-lg px-4 py-2 mt-2 mb-6">
        <span className="text-gray-500 text-sm">Booking ID: </span>
        <span className="text-laser-cyan font-mono font-bold text-lg">#{booking.id}</span>
      </div>

      {isInteract && !validated && (
        <>
          <div className="bg-laser-orange/5 border border-laser-orange/20 rounded-xl p-6 mb-6 text-left">
            <h3 className="text-laser-orange font-bold text-lg mb-3">💳 Send your payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-white font-bold text-base">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Send to</span>
                <span className="text-laser-cyan font-mono">lucasnavilloz@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Note</span>
                <span className="text-white font-mono text-xs">
                  {booking.first_name} {booking.last_name} – {session.title}
                </span>
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            onClick={handleValidate}
            disabled={validating}
            className="w-full py-3 mb-4 bg-laser-green/10 border border-laser-green text-laser-green
              rounded-lg hover:bg-laser-green/20 transition-all font-semibold disabled:opacity-50"
          >
            {validating ? 'Confirming...' : "✓ I've sent the payment"}
          </button>

          <p className="text-gray-600 text-xs">
            Save your booking ID{' '}
            <span className="text-laser-cyan font-mono">#{booking.id}</span> — you can also
            validate later at the "Validate Payment" page.
          </p>
        </>
      )}

      {isInteract && validated && (
        <div className="bg-laser-green/5 border border-laser-green/20 rounded-lg p-4 mb-4">
          <p className="text-laser-green font-medium">
            ✓ Payment confirmed — your spot is locked in!
          </p>
        </div>
      )}
    </div>
  );
}

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    getSession(id)
      .then((res) => setSession(res.data))
      .catch(() => setError('Session not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBookingSuccess = (newBooking, sessionData) => {
    setBooking(newBooking);
    getSession(id).then((res) => setSession(res.data));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-laser-cyan animate-pulse">Loading session...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-xl mb-4">{error || 'Session not found'}</p>
        <button onClick={() => navigate('/')} className="text-laser-cyan hover:underline">
          ← Back to sessions
        </button>
      </div>
    );
  }

  const isFull = parseInt(session.available_spots) <= 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
      >
        ← All sessions
      </button>

      <SessionInfo session={session} />

      {booking ? (
        <BookingSuccess booking={booking} session={session} />
      ) : isFull ? (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-4">😔</p>
          <p className="text-xl font-bold text-red-400 mb-2">This session is fully booked</p>
          <p className="text-gray-500 mb-6">All spots have been taken.</p>
          <button onClick={() => navigate('/')} className="text-laser-cyan hover:underline">
            Browse other sessions
          </button>
        </div>
      ) : (
        <BookingForm session={session} onSuccess={handleBookingSuccess} />
      )}
    </div>
  );
}
