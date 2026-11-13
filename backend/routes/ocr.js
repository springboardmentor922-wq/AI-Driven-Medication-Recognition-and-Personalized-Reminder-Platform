const r = require('express').Router();
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const auth = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Upload an image file'));
    }
    cb(null, true);
  }
});

r.post('/', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Choose an image' });
  try {
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    const out = await axios.post(
      `${process.env.OCR_URL || 'http://localhost:8000'}/ocr`,
      form,
      { headers: form.getHeaders(), timeout: 90000, maxBodyLength: 6 * 1024 * 1024 }
    );
    res.json(out.data);
  } catch (err) {
    const detail = err.response?.data?.detail || err.response?.data?.message;
    res.status(502).json({
      message: detail || (err.code === 'ECONNABORTED'
        ? 'OCR service timed out. Try a smaller, clearer image.'
        : 'OCR service unavailable')
    });
  }
});

module.exports = r;
