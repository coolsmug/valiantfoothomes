const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AboutSchema = new Schema ({
    company_name: {
        type: String,
        required: true,
    },
    
    address: {
        type: String,
        required: true,
    },
    
    state: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
        
    mobile2: {
        type: String,
       
    },
    mobile3: {
        type: String,
        
    },
    phone: {
        type: String,
        
    },
     email: {
        type: String,
        required: true,
    },
    
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

  },
  { timestamps: true }
  );

const About = mongoose.model("About", AboutSchema);
module.exports = About;

