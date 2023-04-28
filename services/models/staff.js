const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const staffSchema = new Schema ({
    first_name : {
        type: String,
        required: true,
    },
    second_name: {
        type: String,
        required: true,
    },
    position: {
        type: String,
        required: true
    },

    propid: [
        String
   ],

    landid: [
        String
   ], 
   
    email: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: false,
    },
    performance:{
        type: String,
        required: true,
    },
    phone: {
        type: String,
       
    },
    about: {
        type: String,
        required: true,
    },
    linkedin: {
        type: String,
        
    },
    facebook: {
        type: String,
        
    },
    instagram: {
        type: String,
        
    },
    twitter: {
        type: String,
        
    },
    whatsapp: {
        type: String,
        
    },
    img:{
        data: Buffer,
        contentType: String,
    },
},
{ timestamps: true }
);

const Staff = mongoose.model("Staff", staffSchema);

module.exports = Staff;


