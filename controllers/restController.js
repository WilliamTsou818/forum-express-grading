const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category

const restController = {
  getRestaurants: (req, res) => {
    const whereQuery = {}
    let categoryId = ''
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery.CategoryId = categoryId
    }
    Restaurant.findAll({
      raw: true,
      nest: true,
      include: [Category],
      where: whereQuery
    })
      .then(restaurants => {
        const restaurantData = restaurants.map(r => ({
          ...r,
          description: r.description.substring(0, 50),
          categoryName: r.Category.name
        }))
        Category.findAll({ raw: true, nest: true }).then(categories => {
          return res.render('restaurants', {
            restaurants: restaurantData,
            categories: categories,
            categoryId: categoryId
          })
        })
      })
  },
  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id, { include: Category })
      .then(restaurant => res.render('restaurant', { restaurant: restaurant.toJSON() }))
  }
}

module.exports = restController
