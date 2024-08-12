const User = require("../../data/User");

const getUser = async (req, res) => {
  console.log("someone tried getting their user")
  const sub = req.body.sub;
  if (!sub) return res.status(400).json({ message: "Cannot get user sub" });
  try {
    let user = await User.findOne({ sub: sub }).exec();
    const previousGenerations = user.previousGenerations;
    res.status(200).json( {previousGenerations} );
  } catch (error) {
    res.status(404).json({ message: "No user found" });
  }
};

module.exports = { getUser };