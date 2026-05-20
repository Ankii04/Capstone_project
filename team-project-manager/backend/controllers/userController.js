const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('name email role').sort({ name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
