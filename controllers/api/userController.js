const User = require("../../data/User");

const getUser = async (req, res) => {
  console.log("someone tried getting their user")
  const sub = req.body.sub;
  if (!sub) return res.status(400).json({ message: "Cannot get user sub" });
  try {
    let user = await User.findOne({ sub: sub }).exec();
    if (!user) res.status(404);
    const previousGenerations = user.previousGenerations;
    res.status(200).json( {previousGenerations} );
  } catch (error) {
    res.status(500).json({ message: "Error getting user" });
  }
};

module.exports = { getUser };