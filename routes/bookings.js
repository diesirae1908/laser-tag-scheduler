const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.post('/', async (req, res) => {
  const { session_id, first_name, last_name, whatsapp, spots_count } = req.body;

  if (!session_id || !first_name || !last_name || !whatsapp || !spots_count) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (spots_count < 1 || spots_count > 20) {
    return res.status(400).json({ error: 'Invalid number of spots' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the session row first (FOR UPDATE requires no GROUP BY)
    const sessionLock = await client.query(
      `SELECT * FROM sessions WHERE id = $1 AND is_active = true FOR UPDATE`,
      [session_id]
    );

    if (sessionLock.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Session not found or inactive' });
    }

    const session = sessionLock.rows[0];

    // Calculate available spots separately now that the row is locked
    const spotsResult = await client.query(
      `SELECT COALESCE(SUM(spots_count) FILTER (WHERE payment_status != 'cancelled'), 0) AS booked
       FROM bookings WHERE session_id = $1`,
      [session_id]
    );
    const booked = parseInt(spotsResult.rows[0].booked);
    const available_spots = session.total_spots - booked;
    session.available_spots = available_spots;

    if (available_spots < spots_count) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Only ${available_spots} spot(s) remaining` });
    }

    const payment_status =
      session.payment_type === 'at_location' ? 'confirmed' : 'placeholder';

    const bookingResult = await client.query(`
      INSERT INTO bookings (session_id, first_name, last_name, whatsapp, spots_count, payment_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      session_id,
      first_name.trim(),
      last_name.trim(),
      whatsapp.trim(),
      parseInt(spots_count),
      payment_status,
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      booking: bookingResult.rows[0],
      session,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.patch('/:id/validate', async (req, res) => {
  const { last_name } = req.body;

  if (!last_name) {
    return res.status(400).json({ error: 'Last name is required' });
  }

  try {
    const result = await pool.query(`
      UPDATE bookings
      SET payment_status = 'validated'
      WHERE id = $1
        AND LOWER(last_name) = LOWER($2)
        AND payment_status = 'placeholder'
      RETURNING *
    `, [req.params.id, last_name]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Booking not found, already validated, or last name mismatch' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
