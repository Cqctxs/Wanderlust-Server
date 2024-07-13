const User = require('../../data/User');

const getUserByUsername = async (req, res) => {
    const username = req.params.username;
    if (!username) return res.status(400).json({ 'message': 'username is required' });
    try {
        const foundUser = await User.findOne({username: username}).exec();
        if (!foundUser) res.status(404);
        const user = foundUser.username;
        const completed = foundUser.completed;
        res.json({ user, completed });
    } catch (err) {
        res.status(500).json({ 'message': err.message });
    }
}

const updateUserByUsername = async (req, res) => {
    const completed = req?.body?.completed
    if (!completed) {
        return res.status(400).json({ 'message': 'Completed is required.' });
    }
    const username = req.params.username;
    if (!username) return res.status(400).json({ 'message': 'username is required' });
    try {
        const foundUser = await User.findOne({username: username}).exec();
        console.log(JSON.stringify(foundUser));
        if (!foundUser) res.status(404);
        foundUser.completed = completed;
        const result = await foundUser.save();
        res.json({ username, completed });
    } catch (err) {
        res.status(500).json({ 'message': err.message });
        console.log(err.message);
    }
}


module.exports = { getUserByUsername, updateUserByUsername };