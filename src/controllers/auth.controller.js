const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

const signToken = (id) =>
  jwt.sign({
    id
  }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      organisation
    } = req.body;
    const exists = await User.findOne({
      email
    });
    if (exists) return res.status(400).json({
      message: 'Email already registered'
    });
    const user = await User.create({
      name,
      email,
      password,
      role,
      organisation
    });
    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name,
        email,
        role,
        organisation
      }
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;
    const user = await User.findOne({
      email
    });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email,
        role: user.role,
        organisation: user.organisation
      }
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};