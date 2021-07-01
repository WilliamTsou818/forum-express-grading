const db = require('../models')
const Restaurant = db.Restaurant

const adminController = {
  getRestaurants: (req, res) => {
    return Restaurant.findAll({ raw: true, nest: true })
      .then(restaurants => res.render('admin/restaurants', { restaurants: restaurants }))
      .catch(err => console.error(err))
  }
}

module.exports = adminController
