const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServiceSchema = ({
    img:{
        data: Buffer,
        contentType: String,
    },

    heading: {
        type: String,
        required: true,
    },

    about: {
        type: String,
        required: true,
    }
})

const Service = mongoose.model("Service", ServiceSchema);
module.exports = Service;