const bcrypt = require('bcryptjs')
const db = require('../models')
const { User, Restaurant, Comment, Favorite, Like, Followship } = db

const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const helpers = require('../_helpers')

const userService = {
  getUser: (req, res, callback) => {
    const userId = req.params.id
    const isSelf = helpers.getUser(req).id === Number(userId)
    return User.findByPk(userId, {
      include: [
        { model: User, as: 'Followers' },
        { model: User, as: 'Followings' },
        { model: Restaurant, as: 'FavoritedRestaurants' },
        { model: Comment, include: Restaurant }
      ]
    })
      .then(currentUser => {
        // 取得追蹤者、正在追蹤與收藏餐廳的數據
        currentUser = currentUser.toJSON()
        const followingCounts = currentUser.Followings.length
        const followerCounts = currentUser.Followers.length
        const favRestaurantCounts = currentUser.FavoritedRestaurants.length
        const isFollowed = currentUser.Followers.map((d) => d.id).includes(
          helpers.getUser(req).id
        )

        // 剔除重複評論的餐廳
        const restaurantSet = new Set()
        const comments = currentUser.Comments.filter(comment => {
          return restaurantSet.has(comment.Restaurant.id) ? false : restaurantSet.add(comment.Restaurant.id)
        })
        const commentCounts = comments.length

        const data = {
          currentUser: currentUser,
          commentCounts: commentCounts,
          comments: comments,
          followingCounts: followingCounts,
          followerCounts: followerCounts,
          favRestaurantCounts: favRestaurantCounts,
          isSelf: isSelf,
          isFollowed: isFollowed
        }
        return callback(data)
      })
  },
  putUser: async (req, res, callback) => {
    const userId = req.params.id
    if (!req.body.name) {
      const data = { status: 'error', message: '使用者名稱為必填資訊！' }
      return callback(data)
    }

    if (helpers.getUser(req).id !== Number(userId)) {
      const data = { status: 'error', message: '不可編輯其他使用者的資料！' }
      return callback(data)
    }

    const { file } = req
    imgur.setClientID(IMGUR_CLIENT_ID)
    // 上傳圖片與更新使用者資料
    if (file) {
      imgur.upload(file.path, async (err, img) => {
        if (err) console.log(`Error: ${err}`)
        const user = await User.findByPk(userId)
        await user.update({
          name: req.body.name,
          image: file ? img.data.link : user.image
        })
        const data = { status: 'success', message: '已成功修改使用者資料' }
        return callback(data)
      })
    } else {
      const user = await User.findByPk(userId)
      await user.update({
        name: req.body.name,
        image: user.image
      })
      const data = { status: 'success', message: '已成功修改使用者資料' }
      return callback(data)
    }
  },
  addLike: async (req, res, callback) => {
    const [like, created] = await Like.findOrCreate({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      },
      defaults: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })

    if (!created) {
      const data = { status: 'error', message: '該餐廳已按過讚，不可重複按讚' }
      return callback(data)
    }

    const data = { status: 'success', message: '按讚成功' }
    return callback(data)
  },
  removeLike: async (req, res, callback) => {
    const like = await Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })

    // 確認是否有 like 資料
    if (!like) {
      const data = { status: 'error', message: '並未按讚，無法移除' }
      return callback(data)
    }

    // 刪除 like 資料
    await like.destroy()
    const data = { status: 'success', message: '已移除讚' }
    return callback(data)
  },
  getTopUser: async (req, res, callback) => {
    let users = await User.findAll({
      nest: true,
      include: [
        { model: User, as: 'Followers' }
      ]
    })

    users = users.map(user => ({
      ...user.dataValues,
      FollowerCount: user.Followers.length,
      isFollowed: req.user.Followings.map(d => d.id).includes(user.id)
    }))
    // 按照追隨者排序使用者資料
    users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
    const data = { users: users }
    return callback(data)
  },
  addFollowing: async (req, res, callback) => {
    const [followship, created] = await Followship.findOrCreate({
      where: {
        followerId: helpers.getUser(req).id,
        followingId: req.params.userId
      },
      defaults: {
        followerId: helpers.getUser(req).id,
        followingId: req.params.userId
      }
    })
    // 確認是否已追隨
    if (!created) {
      const data = { status: 'error', message: '您已追蹤該使用者' }
      return callback(data)
    }

    const data = { status: 'success', message: '追蹤成功' }
    return callback(data)
  },
  removeFollowing: async (req, res, callback) => {
    const followship = await Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })

    if (!followship) {
      const data = { status: 'error', message: '未追蹤該使用者，無法取消追蹤' }
      return callback(data)
    }

    await followship.destroy()
    const data = { status: 'success', message: '已成功取消追蹤' }
    return callback(data)
  },
  addFavorite: async (req, res, callback) => {
    const [favorite, created] = await Favorite.findOrCreate({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      },
      defaults: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })

    // 檢查是否已收藏
    if (!created) {
      const data = { status: 'error', message: '您已收藏該餐廳' }
      return callback(data)
    }

    const data = { status: 'success', message: '已成功加入最愛清單' }
    return callback(data)
  },
  removeFavorite: async (req, res, callback) => {
    const favorite = await Favorite.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })

    // 檢查是否已收藏
    if (!favorite) {
      const data = { status: 'error', message: '未收藏該餐廳，無法取消收藏' }
      return callback(data)
    }

    favorite.destroy()
    const data = { status: 'success', message: '已成功從最愛清單中移除' }
    return callback(data)
  }
}

module.exports = userService
