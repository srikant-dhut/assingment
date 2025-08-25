const mongoose = require('mongoose');

const DbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Db connect successfull');

    } catch (error) {
        console.log('Db Connection error', error)
    }
}
module.exports = DbConnect;

 