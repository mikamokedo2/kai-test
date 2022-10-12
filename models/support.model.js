const mongoose = require("mongoose");

const SupportSchema = mongoose.Schema({
    email: {
      type: String,
      require: true,
    },
    address: {
      type: String,
      require: true,
    },
    phone: {
      type: String,
      require: true,
    },
    description: {
        type: String,
        require: true,
      },
      status: {
        type: String,
        require: true,
      },

  });
  
  module.exports = mongoose.model("Supports", SupportSchema);