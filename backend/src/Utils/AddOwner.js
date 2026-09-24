const bcrypt = require("bcrypt")
const { User } = require("../models/User.schema")

const addOwner = (password, name, email) => {

    bcrypt.hash(password, 10)
    .then((data) => {
        User.create({
            name ,
            email ,
            password : data,
            role : "owner"
        })
    })
}


module.exports = { addOwner }