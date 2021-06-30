const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User

const userController = {
  signUpPage: (req, res) => {
    return res.render('signup')
  },
  signUp: (req, res) => {
    const name = req.body.name
    const email = req.body.email
    return bcrypt
      .genSalt(10)
      .then(salt => bcrypt.hash(req.body.password, salt))
      .then(hash =>
        User.create({
          name,
          email,
          password: hash
        })
      )
      .then(() => res.redirect('/signin'))
      .catch(err => console.error(err))
  }
}

module.exports = userController
