const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
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
  }
}

module.exports = adminService
