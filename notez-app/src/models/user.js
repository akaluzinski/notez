const mongoose = require('mongoose');
const {isValid, hash} = require('../security/hashing');
const {generateToken } = require('../security/tokens');
const validator = require('validator');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: 3,
        maxLength: 200,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
          validator: function(emailValue) {
              return validator.isEmail(emailValue)
          }
        },
        lowercase: true
    },
    password: { //TODO add legit auth with firebase
        type: String,
        required: true,
        minLength: 6,
        trim: true
    },
    tokens: [{
        token: {
            type: String,
            required: true,
        }
    }],
    avatar: {
        type: Buffer
    },
    settings: {
        dailyNotificationsEnabled: {
            type: Boolean,
            default: true
        }
    }
},{
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

userSchema.methods.toJSON = function() {
    const user = this;
    const userProfile = user.toObject();
    delete userProfile.password;
    delete userProfile.tokens;
    delete userProfile.avatar;

    return userProfile;
};

userSchema.methods.generateToken = async function () {
    const user = this;
    const token = await generateToken({ _id: user._id },  '7 days');
    user.tokens = [...user.tokens, { token } ];
    await user.save();
    return token;
};

userSchema.statics.findBySettings = async (settings) => {
    const users = await User.find({
        settings
    });
    return users;
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    if (!user) {
        throw new Error('Unable to login');
    }
    const isValidPassword = await isValid(password, user.password);
    if (!isValidPassword) {
        throw new Error('Unable to login');
    }
    return user;
};

userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await hash(user.password);
    }
    next();
});

userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id});
    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;
