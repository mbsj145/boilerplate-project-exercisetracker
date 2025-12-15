require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb+srv://muhammadbilal_db_user:nnFnqxi73A9MqkHz@cluster0.rcxmcoo.mongodb.net/exercise-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  duration: Number,
  date: Date
});

// Models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Home
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// ✅ Create New User
app.post('/api/users', async (req, res) => {
  const user = new User({ username: req.body.username });
  const savedUser = await user.save();

  res.json({
    username: savedUser.username,
    _id: savedUser._id
  });
});

// ✅ Get All Users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, '_id username');
  res.json(users);
});

// ✅ Add Exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const user = await User.findById(req.params._id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const date = req.body.date
    ? new Date(req.body.date)
    : new Date();

  const exercise = new Exercise({
    userId: user._id,
    description: req.body.description,
    duration: Number(req.body.duration),
    date
  });

  const savedExercise = await exercise.save();

  res.json({
    username: user.username,
    description: savedExercise.description,
    duration: savedExercise.duration,
    date: savedExercise.date.toDateString(),
    _id: user._id
  });
});

// ✅ Get Exercise Log
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const user = await User.findById(req.params._id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let filter = { userId: user._id };

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  let query = Exercise.find(filter).select('description duration date');

  if (limit) {
    query = query.limit(Number(limit));
  }

  const exercises = await query.exec();

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }))
  });
});

// Listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
