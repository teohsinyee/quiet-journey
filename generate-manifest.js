const fs = require('fs');
const path = require('path');

const notesDir = path.join(__dirname, 'docs', 'notes');
const outFile = path.join(__dirname, 'docs', 'data', 'manifest.json');

const NT_BOOKS = [
  'Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
];

function parseNote(file){
  const filePath = path.join(notesDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const titleLine = lines.find(l => l.startsWith('# ')) || '';
  const title = titleLine.replace('#','').trim();
  const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '';
  const bookPart = title.split(' - ')[1] || '';
  const bookName = bookPart.split(' ')[0];
  const type = NT_BOOKS.includes(bookName) ? 'NT' : 'OT';
  let excerpt = '';
  const summaryIdx = lines.indexOf('## Summary');
  if (summaryIdx !== -1){
    for (let i=summaryIdx+1; i<lines.length; i++){
      const line = lines[i].trim();
      if (line && !line.startsWith('##')){ excerpt = line.replace(/^[-*]\s*/, ''); break; }
    }
  }
  return {
    category: 'reflection',
    type,
    title,
    date,
    path: `./notes/${file}`,
    excerpt
  };
}

const files = fs.readdirSync(notesDir)
  .filter(f => /^\d{4}-\d{2}-\d{2}.*\.md$/.test(f));

const entries = files.map(parseNote).sort((a,b)=> a.date.localeCompare(b.date));

const manifest = { target_reflections: 260, entries };

fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2));
console.log(`Manifest written with ${entries.length} entries.`);
