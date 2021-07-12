const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Comment = db.Comment
const Restaurant = db.Restaurant
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship

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
    const userId = req.params.id
    const isSelf = helpers.getUser(req).id === Number(userId)
    User.findByPk(userId, {
      include: [
        { model: User, as: 'Followers', attributes: ['image', 'id'] },
        { model: User, as: 'Followings', attributes: ['image', 'id'] },
        { model: Restaurant, as: 'FavoritedRestaurants' }
      ]
    })
      .then(currentUser => {
        currentUser = currentUser.toJSON()
        const followingCounts = currentUser.Followings.length
        const followerCounts = currentUser.Followers.length
        const favRestaurantCounts = currentUser.FavoritedRestaurants.length
        const isFollowed = currentUser.Followers.map((d) => d.id).includes(
          helpers.getUser(req).id
        )
        Comment.findAndCountAll({
          raw: true,
          nest: true,
          include: [Restaurant],
          where: { userId: userId }
        })
          .then(results => {
            const commentData = results.rows.map(comment => ({
              ...comment,
              restaurantId: comment.Restaurant.id,
              restaurantImage: comment.Restaurant.image
            }))
            const commentCounts = results.count
            return res.render('profile', {
              currentUser,
              commentCounts,
              comments: commentData,
              followingCounts,
              followerCounts,
              favRestaurantCounts,
              isSelf,
              isFollowed
            })
          })
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
    if (!req.body.name) {
      req.flash('error_messages', '使用者名稱為必填資訊！')
      return res.redirect('back')
    }
    const { file } = req
    if (file) {
      imgur.setClientID(IMGUR_CLIENT_ID)
      imgur.upload(file.path, (err, img) => {
        if (err) console.log(`Error: ${err}`)
        return User.findByPk(req.params.id).then(user => {
          user.update({
            name: req.body.name,
            image: file ? img.data.link : user.image
          }).then(() => {
            req.flash('success_messages', '已成功修改使用者資料')
            res.redirect(`/users/${req.params.id}`)
          })
        })
      })
    } else {
      return User.findByPk(req.params.id).then(user => {
        user.update({
          name: req.body.name,
          image: user.image
        })
          .then(() => {
            req.flash('success_messages', '已成功修改使用者資料')
            res.redirect(`/users/${req.params.id}`)
          })
          .catch(err => console.error(err))
      })
    }
  },
  addLike: (req, res) => {
    return Like.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then(() => {
        req.flash('success_messages', '已按讚')
        return res.redirect('back')
      })
  },
  removeLike: (req, res) => {
    return Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then(like => {
        like.destroy()
          .then(() => {
            req.flash('success_messages', '已移除讚')
            return res.redirect('back')
          })
      })
  },
  getTopUser: (req, res) => {
    return User.findAll({
      nest: true,
      include: [
        { model: User, as: 'Followers' }
      ]
    })
      .then(users => {
        users = users.map(user => ({
          ...user.dataValues,
          FollowerCount: user.Followers.length,
          isFollowed: req.user.Followings.map(d => d.id).includes(user.id)
        }))
        users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
        return res.render('topUser', { users: users })
      })
  },
  addFollowing: (req, res) => {
    return Followship.create({
      followerId: req.user.id,
      followingId: req.params.userId
    })
      .then(() => {
        return res.redirect('back')
      })
  },
  removeFollowing: (req, res) => {
    return Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then(followship => {
        followship.destroy()
          .then((followship) => {
            return res.redirect('back')
          })
      })
  },
  addFavorite: (req, res) => {
    return Favorite.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then(() => {
        req.flash('success_messages', '已成功加入最愛清單')
        return res.redirect('back')
      })
  },
  removeFavorite: (req, res) => {
    return Favorite.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then(favorite => {
        favorite.destroy()
          .then(() => {
            req.flash('success_messages', '已成功從最愛清單中移除')
            return res.redirect('back')
          })
      })
  }
}

module.exports = userController
