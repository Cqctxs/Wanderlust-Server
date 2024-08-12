let latestValue = null; 

const setInteger = (req, res) => {
    // accept a json not a body text file
    const {value} = req.body;

    if (typeof value !== 'number' || !Number.isInteger(value)){
        return res.status(400).json({error: 'invalid integer value'});
    }

    latestValue = value;
    res.status(200).json({ message: "value updated successfully"})
}

const getInteger = (req, res) => {
    if (latestValue === null){
        return res.status(404).json({message: "no value set"});
    }
    res.status(200).json({value:latestValue});
}

module.exports = {setInteger, getInteger};