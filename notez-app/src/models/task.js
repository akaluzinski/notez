const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    description: {
        type: String,
        trim: true,
        required: true,
        minLength: 1,
        maxLength: 2000
    },
    completed: {
        trim: true,
        default: false,
        type: Boolean
    }
});

taskSchema.pre('save', async function (next) {
    console.log('task middleware');
    next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
