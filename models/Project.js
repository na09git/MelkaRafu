const mongoose = require('mongoose')

const ProjectSchema = new mongoose.Schema({


    imageBase64: {
        type: String,
        required: true,
    },
    contentType: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    body: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        default: 'Infrastructure',
        enum: ['Infrastructure', 'Agriculture', 'Education', 'Industry', 'Health', 'Other'],
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


module.exports = mongoose.model('Project', ProjectSchema)
