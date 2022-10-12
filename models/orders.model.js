const mongoose = require("mongoose");

const OrderSchema = mongoose.Schema({
  user: {
    type: String,
    require: true,
  },
  amount: {
    type: Number,
    require: true,
  },
  emailorphone: {
    type: String,
    require: true,
    lowercase: true,
  },
  status: {
    type: String,
    require: true,
  },
  value: {
    type: Number,
    require: true,
  },
  id: {
    type: String,
    require: true,
    unique: true,
  },
});

module.exports = mongoose.model("Orders", OrderSchema);
