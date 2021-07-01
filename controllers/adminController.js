const db = require('../models')
const Restaurant = db.Restaurant

const adminController = {
  getRestaurants: (req, res) => {
    return Restaurant.findAll({ raw: true, nest: true })
      .then(restaurants => res.render('admin/restaurants', { restaurants: restaurants }))
      .catch(err => console.error(err))
  },
  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id)
      .then(restaurant => {
        res.render('admin/restaurant', { restaurant: restaurant.toJSON() })
      })
  },
  createRestaurant: (req, res) => {
    return res.render('admin/create')
  },
  postRestaurant: (req, res) => {
    if (!req.body.name || !req.body.tel) {
      req.flash('error_messages', '餐廳名稱與電話為必填資訊')
      return res.redirect('back')
    }
    return Restaurant.create({
      name: req.body.name,
      tel: req.body.tel,
      address: req.body.address,
      opening_hours: req.body.opening_hours,
      description: req.body.description
    })
      .then(() => {
        req.flash('success_messages', '已成功創建餐廳資料')
        res.redirect('/admin/restaurants')
      })
      .catch(err => console.error(err))
  }
}

module.exports = adminController
