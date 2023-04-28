const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const propertySchema = new Schema ({
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
    bed : {
        type: String,
        required: true,
    },
    baths : {
        type: String,
        required: true,
    },
    garage : {
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
  floor_plan: { 
    data: Buffer,
    contentType: String,
  },
  video: { 
    data: Buffer,
    contentType: String,
  },
    
},
{ timestamps: true }
);

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;