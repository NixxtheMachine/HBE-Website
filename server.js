const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const mediaDir = path.join(rootDir, 'public-media');
const mediaConfigPath = path.join(rootDir, 'media-config.json');

const allowedKeys = new Set([
  'heroPortrait',
  'professionalPortrait',
  'clinicalVideo',
  'introVideo'
]);

const defaultMediaConfig = {
  heroPortrait: '/assets/images/hazeyhead.png',
  professionalPortrait: '/assets/images/professional-portrait-hbe.jpeg',
  clinicalVideo: '/assets/videos/clinical-hbe-surgery-final.mov',
  introVideo: '/assets/videos/intro-hbe-final.mov'
};

if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
if (!fs.existsSync(mediaConfigPath)) {
  fs.writeFileSync(mediaConfigPath, JSON.stringify(defaultMediaConfig, null, 2));
}

function readMediaConfig() {
  try {
    const raw = fs.readFileSync(mediaConfigPath, 'utf8');
    return { ...defaultMediaConfig, ...JSON.parse(raw) };
  } catch (_error) {
    return { ...defaultMediaConfig };
  }
}

function writeMediaConfig(config) {
  fs.writeFileSync(mediaConfigPath, JSON.stringify(config, null, 2));
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, mediaDir),
  filename: (req, file, cb) => {
    const key = (req.body.key || 'media').replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
    const fileName = `${key}-${Date.now()}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 }
});

app.use(express.json());
app.use('/public-media', express.static(mediaDir));
app.use(express.static(rootDir));

app.get('/api/media', (_req, res) => {
  res.json(readMediaConfig());
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  const key = req.body.key;
  if (!allowedKeys.has(key)) {
    return res.status(400).json({ error: 'Invalid media key.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const mediaUrl = `/public-media/${req.file.filename}`;
  const current = readMediaConfig();
  current[key] = mediaUrl;
  writeMediaConfig(current);

  res.json({ key, url: mediaUrl });
});

app.listen(PORT, () => {
  console.log(`Media backend running on http://localhost:${PORT}`);
});
