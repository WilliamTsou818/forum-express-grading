const db = require('../models')
const { User, Category, Restaurant } = db
const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

const adminService = {
  getRestaurants: (req, res, callback) => {
    return Restaurant.findAll({ raw: true, nest: true, include: [Category] })
      .then(restaurants => {
        callback({ restaurants: restaurants })
      })
  },
  getRestaurant: (req, res, callback) => {
    return Restaurant.findByPk(req.params.id, { include: [Category] })
      .then(restaurant => {
        callback({ restaurant: restaurant.toJSON() })
      })
  },
  deleteRestaurant: (req, res, callback) => {
    return Restaurant.findByPk(req.params.id)
      .then(restaurant => restaurant.destroy())
      .then(() => callback({ status: 'success', message: '' }))
  },
  postRestaurant: (req, res, callback) => {
    if (!req.body.name || !req.body.tel) {
      return callback({ status: 'error', message: '餐廳名稱與電話為必填資訊' })
    }

    const { file } = req
    if (file) {
      imgur.setClientID(IMGUR_CLIENT_ID)
      imgur.upload(file.path, (err, img) => {
        if (err) console.log(`Error: ${err}`)
        return Restaurant.create({
          name: req.body.name,
          tel: req.body.tel,
          address: req.body.address,
          opening_hours: req.body.opening_hours,
          description: req.body.description,
          image: file ? img.data.link : null,
          CategoryId: req.body.categoryId
        })
          .then(() => {
            callback({ status: 'success', message: '已成功創建餐廳資料' })
          })
          .catch(err => console.error(err))
      })
    } else {
      return Restaurant.create({
        name: req.body.name,
        tel: req.body.tel,
        address: req.body.address,
        opening_hours: req.body.opening_hours,
        description: req.body.description,
        image: null,
        CategoryId: req.body.categoryId
      })
        .then(() => {
          callback({ status: 'success', message: '已成功創建餐廳資料' })
        })
        .catch(err => console.error(err))
    }
  },
  putRestaurant: (req, res, callback) => {
    if (!req.body.name || !req.body.tel) {
      return callback({ status: 'error', message: '餐廳名稱與電話為必填資訊' })
    }

    const { file } = req
    if (file) {
      imgur.setClientID(IMGUR_CLIENT_ID)
      imgur.upload(file.path, (err, img) => {
        if (err) console.log(`Error: ${err}`)
        return Restaurant.findByPk(req.params.id).then(restaurant => {
          restaurant.update({
            name: req.body.name,
            tel: req.body.tel,
            address: req.body.address,
            opening_hours: req.body.opening_hours,
            description: req.body.description,
            image: file ? img.data.link : restaurant.image,
            CategoryId: req.body.categoryId
          }).then(() => {
            callback({ status: 'success', message: '已成功創建餐廳資料' })
          })
        })
      })
    } else {
      return Restaurant.findByPk(req.params.id).then(restaurant => {
        restaurant.update({
          name: req.body.name,
          tel: req.body.tel,
          address: req.body.address,
          opening_hours: req.body.opening_hours,
          description: req.body.description,
          image: restaurant.image,
          CategoryId: req.body.categoryId
        })
          .then(() => {
            callback({ status: 'success', message: '已成功創建餐廳資料' })
          })
          .catch(err => console.error(err))
      })
    }
  },
  getUsers: async (req, res, callback) => {
    const users = await User.findAll({ raw: true, nest: true })
    const data = { users: users }
    return callback(data)
  },
  toggleAdmin: async (req, res, callback) => {
    const id = req.params.id
    const user = await User.findByPk(id)

    // 防止核心管理者的權限遭修改
    if (user.email === 'root@example.com') {
      const data = { status: 'error', message: '核心管理者的權限不可更動！' }
      return callback(data)
    } else {
    // 修改權限
      user.isAdmin = !user.isAdmin
      await user.update({ isAdmin: user.isAdmin })
      const data = { status: 'success', message: '已修改使用者權限！' }
      return callback(data)
    }
  }
}

module.exports = adminService
