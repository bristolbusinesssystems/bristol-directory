require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const fs = require('fs');
const { query } = require('./db/index');
const { seed } = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/', require('./routes/index'));
app.use('/listing', require('./routes/listings'));
app.use('/category', require('./routes/categories'));
app.use('/search', require('./routes/search'));
app.use('/claim', require('./routes/claim'));

app.use((req, res) => {
  res.status(404).render('error', { title: 'Page Not Found', message: 'The page you are looking for does not exist.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Error', message: err.message });
});

async function startServer() {
  app.listen(PORT, () => console.log(`Bristol Digital Direct running on port ${PORT}`));
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    await query(sql);
    console.log('Database ready.');
    await seed();
  } catch (err) {
    console.error('Startup error:', err.message);
  }
}

startServer();
