const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const availableSpotsQuery = `
  s.total_spots - COALESCE(
    SUM(b.spots_count) FILTER (WHERE b.payment_status != 'cancelled'), 0
  ) AS available_spots
`;

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, ${availableSpotsQuery}
      FROM sessions s
      LEFT JOIN bookings b ON s.id = b.session_id
      WHERE s.is_active = true
      GROUP BY s.id
      ORDER BY s.date ASC, s.time ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, ${availableSpotsQuery}
      FROM sessions s
      LEFT JOIN bookings b ON s.id = b.session_id
      WHERE s.id = $1
      GROUP BY s.id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
