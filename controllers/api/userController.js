// include model and bcrypt
const bcrypt = require('bcryptjs')
const db = require('../../models')
const User = db.User

// include service
const userService = require('../../services/userService')

// JWT
const jwt = require('jsonwebtoken')
const passportJWT = require('passport-jwt')
const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

const userController = {
  signIn: (req, res) => {
    if (!req.body.email || !req.body.password) {
      return res.json({ status: 'error', message: '請輸入帳號與密碼' })
    }
    const username = req.body.email
    const password = req.body.password

    User.findOne({ where: { email: username } }).then(user => {
      if (!user) return res.status(401).json({ status: 'error', message: '該信箱尚未註冊' })
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ status: 'error', message: '密碼不符' })
      }
      // assign token
      const payload = { id: user.id }
      const token = jwt.sign(payload, process.env.JWT_SECRET)
      return res.json({
        status: 'success',
        message: 'ok',
        token: token,
        user: {
          id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin
        }
      })
    })
  },
  signUp: (req, res) => {
    if (req.body.passwordCheck !== req.body.password) {
      return res.json({ status: 'error', message: '確認密碼不相符！' })
    } else {
      User.findOne({ where: { email: req.body.email } }).then(user => {
        if (user) {
          return res.json({ status: 'error', message: '該信箱已註冊！' })
        } else {
          User.create({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
          }).then(() => {
            return res.json({ status: 'success', message: '成功註冊帳號！' })
          })
        }
      })
    }
  },
  getUser: (req, res) => {
    userService.getUser(req, res, (data) => {
      return res.json(data)
    })
  },
  putUser: (req, res) => {
    userService.putUser(req, res, (data) => {
      return res.json(data)
    })
  },
  addLike: (req, res) => {
    userService.addLike(req, res, (data) => {
      return res.json(data)
    })
  },
  removeLike: (req, res) => {
    userService.removeLike(req, res, (data) => {
      return res.json(data)
    })
  },
  getTopUser: (req, res) => {
    userService.getTopUser(req, res, (data) => {
      return res.json(data)
    })
  },
  addFollowing: (req, res) => {
    userService.addFollowing(req, res, (data) => {
      return res.json(data)
    })
  },
  removeFollowing: (req, res) => {
    userService.removeFollowing(req, res, (data) => {
      return res.json(data)
    })
  },
  addFavorite: (req, res) => {
    userService.addFavorite(req, res, (data) => {
      return res.json(data)
    })
  },
  removeFavorite: (req, res) => {
    userService.removeFavorite(req, res, (data) => {
      return res.json(data)
    })
  }
}

module.exports = userController
