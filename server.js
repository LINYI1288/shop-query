const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data.json');

app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ dest: 'uploads/' });

function parseExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue;
    const raw = String(row[0]);
    const phoneMatch = raw.match(/1[3-9]\d{9}/);
    const phone = phoneMatch ? phoneMatch[0] : '';
    const name = raw.replace(phone, '').trim();
    data.push({ name, phone, amount: row[1] || 0 });
  }
  return data;
}

app.get('/query', (req, res) => {
  const keyword = (req.query.q || '').trim();
  if (!keyword) return res.json({ results: [] });
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const results = data.filter(d =>
    d.name.includes(keyword) || d.phone.includes(keyword)
  );
  res.json({ results });
});

app.post('/upload', upload.single('file'), (req, res) => {
  try {
    const data = parseExcel(req.file.path);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data));
    fs.unlinkSync(req.file.path);
    res.json({ success: true, count: data.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务已启动，端口 ${PORT}`);
});
