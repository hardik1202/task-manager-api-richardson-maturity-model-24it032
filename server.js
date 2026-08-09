const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const Task = require('./models/Task');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

app.use((req, res, next) => {
  if (['POST', 'PUT'].includes(req.method) && req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// GET all tasks
app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET single task by ID
app.get('/tasks/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }
    next(err);
  }
});

// CREATE a task
app.post('/tasks', async (req, res, next) => {
  try {
    const newTask = await Task.create(req.body);
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

// UPDATE a task
app.put('/tasks/:id', async (req, res, next) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(updatedTask);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }
    next(err);
  }
});

// DELETE a task
app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid task ID format' });
    }
    next(err);
  }
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — turns Mongoose errors into clean structured JSON
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(5000, () => console.log('Server running on port 5000'));