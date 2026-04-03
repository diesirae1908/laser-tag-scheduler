const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { adminAuth } = require('../middleware/adminAuth');

router.post('/login', (req, res) => {
  const { password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign(
    { admin: true },
    process.env.JWT_SECRET || 'dev-fallback-secret',
    { expiresIn: '24h' }
  );

  res.json({ token });
});

router.get('/sessions', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*,
        s.total_spots - COALESCE(
          SUM(b.spots_count) FILTER (WHERE b.payment_status != 'cancelled'), 0
        ) AS available_spots,
        COALESCE(SUM(b.spots_count) FILTER (WHERE b.payment_status != 'cancelled'), 0) AS booked_spots,
        COUNT(b.id) AS booking_count
      FROM sessions s
      LEFT JOIN bookings b ON s.id = b.session_id
      GROUP BY s.id
      ORDER BY s.date ASC, s.time ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions', adminAuth, async (req, res) => {
  const { title, description, date, time, location, total_spots, payment_type, price } = req.body;

  if (!title || !date || !time || !location || !total_spots || !payment_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (payment_type === 'interact' && (!price || price <= 0)) {
    return res.status(400).json({ error: 'Price is required for Interact sessions' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO sessions (title, description, date, time, location, total_spots, payment_type, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [title, description || null, date, time, location, total_spots, payment_type, price || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sessions/:id', adminAuth, async (req, res) => {
  const { title, description, date, time, location, total_spots, payment_type, price, is_active } =
    req.body;

  try {
    const bookedResult = await pool.query(`
      SELECT COALESCE(SUM(spots_count) FILTER (WHERE payment_status != 'cancelled'), 0) AS booked
      FROM bookings WHERE session_id = $1
    `, [req.params.id]);

    const booked = parseInt(bookedResult.rows[0].booked);
    if (total_spots < booked) {
      return res.status(400).json({
        error: `Cannot set total spots below current bookings (${booked} spots already booked)`,
      });
    }

    const result = await pool.query(`
      UPDATE sessions
      SET title = $1, description = $2, date = $3, time = $4, location = $5,
          total_spots = $6, payment_type = $7, price = $8, is_active = $9
      WHERE id = $10
      RETURNING *
    `, [title, description || null, date, time, location, total_spots, payment_type, price || null, is_active, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sessions/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions/:id/bookings', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM bookings
      WHERE session_id = $1
      ORDER BY created_at ASC
    `, [req.params.id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/bookings/:id', adminAuth, async (req, res) => {
  const { payment_status } = req.body;
  const validStatuses = ['confirmed', 'placeholder', 'validated', 'cancelled'];

  if (!validStatuses.includes(payment_status)) {
    return res.status(400).json({ error: 'Invalid payment status' });
  }

  try {
    const result = await pool.query(`
      UPDATE bookings SET payment_status = $1 WHERE id = $2 RETURNING *
    `, [payment_status, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bookings/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
