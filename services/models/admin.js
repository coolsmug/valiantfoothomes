const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema ({
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
    role: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: false,
    },
    email:{
        type: String,
        required: true,
    },
    img:{
        data: Buffer,
        contentType: String,
    },
},
{ timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;


