const express = require('express');
const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');
const { authenticateToken } = require('../auth');
const pool = require('../db');
const router = express.Router();

const s3 = new AWS.S3();
const upload = multer({ dest: 'uploads/' });

router.post('/files', authenticateToken, upload.single('file'), async (req, res) => {
  const { folderId } = req.body;
  const file = req.file;
  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${Date.now()}_${file.originalname}`,
    Body: fs.createReadStream(file.path)
  };

  s3.upload(s3Params, async (err, data) => {
    if (err) return res.status(500).send(err);

    const result = await pool.query(
      'INSERT INTO files (name, size, user_id, folder_id, s3_key) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [file.originalname, file.size, req.user.id, folderId, data.Key]
    );
    res.status(201).json(result.rows[0]);
  });
});

router.put('/files/:id/rename', authenticateToken, async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  const result = await pool.query(
    'UPDATE files SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [name, id, req.user.id]
  );
  res.status(200).json(result.rows[0]);
});

router.put('/files/:id/move', authenticateToken, async (req, res) => {
  const { folderId } = req.body;
  const { id } = req.params;
  const result = await pool.query(
    'UPDATE files SET folder_id = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [folderId, id, req.user.id]
  );
  res.status(200).json(result.rows[0]);
});

router.delete('/files/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM files WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, req.user.id]
  );

  if (result.rows.length === 0) return res.status(404).send('File not found');

  const file = result.rows[0];
  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: file.s3_key
  };

  s3.deleteObject(s3Params, (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(file);
  });
});

module.exports = router;
