const express = require('express');
const { authenticateToken } = require('../auth');
const pool = require('../db');
const router = express.Router();

router.post('/folders', authenticateToken, async (req, res) => {
  const { name, parentFolderId } = req.body;
  const result = await pool.query(
    'INSERT INTO folders (name, user_id, parent_folder_id) VALUES ($1, $2, $3) RETURNING *',
    [name, req.user.id, parentFolderId]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
