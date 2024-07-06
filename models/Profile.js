const mongoose = require('mongoose')

const ProfileSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    imageBase64: {
        type: String,
        required: true,
    },
    contentType: {
        type: String,
        required: true,
    },
    about: {
        type: String,
    },
    company: {
        type: String,
    },
    job: {
        type: String,
    },
    country: {
        type: String,
    },
    address: {
        type: String,
    },
    phone: {
        type: String,
    },
    email: {
        type: String,
    },
    twitter: {
        type: String,
    },
    facebook: {
        type: String,
    },
    telegram: {
        type: String,
    },
    instagram: {
        type: String,
    },
    youtube: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('Profile', ProfileSchema)
