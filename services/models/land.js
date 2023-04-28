const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const landSchema = new Schema ({
    property_id : {
        type: String,
        required: true,
    },
    name : {
        type: String,
        required: true,
    },
    location : {
        type: String,
        required: true,
    },
    status : {
        type: String,
        required: true,
    },
    period : {
        type: String,
        required: true,
    },

    area : {
        type: String,
        required: true,
    },

    amenities : [
         String
    ],

    description : {
        type: String,
        required: true,
    },

    img: { 
    data: Buffer,
    contentType: String,
    },

    img2: { 
    data: Buffer,
    contentType: String,
    },
    
},
{ timestamps: true }
);

const Land = mongoose.model("Land", landSchema);

module.exports = Land;