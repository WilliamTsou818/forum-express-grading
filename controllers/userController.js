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
    // confirm password
    if (req.body.passwordCheck !== req.body.password) {
      req.flash('error_messages', '確認密碼與密碼不相符')
      return res.redirect('/signup')
    }
    // confirm unique user
    User.findOne({ where: { email: email } }).then((user) => {
      if (user) {
        req.flash('error_messages', '該信箱已被註冊')
        return res.redirect('/signup')
      }
    })

    return bcrypt
      .genSalt(10)
      .then((salt) => bcrypt.hash(req.body.password, salt))
      .then((hash) =>
        User.create({
          name,
          email,
          password: hash
        })
      )
      .then(() => res.redirect('/signin'))
      .catch((err) => console.error(err))
  },

  signInPage: (req, res) => {
    return res.render('signin')
  },

  signIn: (req, res) => {
    req.flash('success_messages', '已成功登入！')
    res.redirect('/restaurants')
  },

  logout: (req, res) => {
    req.flash('success_messages', '已成功登出！')
    req.logout()
    res.redirect('/signin')
  }
}

module.exports = userController
