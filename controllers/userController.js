const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Comment = db.Comment
const Restaurant = db.Restaurant
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship

const userService = require('../services/userService')

const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const helpers = require('../_helpers')

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
  },
  getUser: (req, res) => {
    userService.getUser(req, res, (data) => {
      return res.render('profile', data)
    })
  },
  editUser: (req, res) => {
    if (String(helpers.getUser(req).id) !== String(req.params.id)) {
      req.flash('error_messages', '無法編輯其他使用者的資料')
      return res.redirect(`/users/${req.user.id}`)
    }
    User.findByPk(req.params.id)
      .then(user => {
        return res.render('editProfile', { user: user.toJSON() })
      })
  },
  putUser: (req, res) => {
    userService.putUser(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      return res.redirect(`/users/${req.user.id}`)
    })
  },
  addLike: (req, res) => {
    userService.addLike(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      return res.redirect('back')
    })
  },
  removeLike: (req, res) => {
    userService.removeLike(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      return res.redirect('back')
    })
  },
  getTopUser: (req, res) => {
    userService.getTopUser(req, res, (data) => {
      return res.render('topUser', data)
    })
  },
  addFollowing: (req, res) => {
    userService.addFollowing(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      return res.redirect('back')
    })
  },
  removeFollowing: (req, res) => {
    userService.removeFollowing(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      return res.redirect('back')
    })
  },
  addFavorite: (req, res) => {
    userService.addFavorite(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      return res.redirect('back')
    })
  },
  removeFavorite: (req, res) => {
    userService.removeFavorite(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      return res.redirect('back')
    })
  }
}

module.exports = userController
