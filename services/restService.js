const db = require('../models')
const { Restaurant, User, Comment, Category, Favorite } = db
const Sequelize = require('sequelize')

const pageLimit = 10
const helpers = require('../_helpers')

const restService = {
  getRestaurants: async (req, res, callback) => {
    let offset = 0
    const whereQuery = {}
    let categoryId = ''
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery.CategoryId = categoryId
    }

    // get restaurant and category model
    let restaurants = await Restaurant.findAndCountAll({
      raw: true,
      nest: true,
      include: [Category],
      where: whereQuery,
      offset: offset,
      limit: pageLimit
    })
    const categories = await Category.findAll({ raw: true, nest: true })

    // handle pagination
    const page = Number(req.query.page) || 1
    const pages = Math.ceil(restaurants.count / pageLimit)
    const totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
    const prev = page - 1 < 1 ? 1 : page - 1
    const next = page + 1 > pages ? pages : page + 1

    // handle restaurant data
    restaurants = restaurants.rows.map(r => ({
      ...r,
      description: r.description.substring(0, 50),
      categoryName: r.Category.name,
      isFavorited: helpers.getUser(req).FavoritedRestaurants.map(d => d.id).includes(r.id),
      isLiked: helpers.getUser(req).LikedRestaurants.map(d => d.id).includes(r.id)
    }))

    const data = {
      restaurants,
      categories,
      categoryId,
      page,
      totalPage,
      prev,
      next
    }
    return callback(data)
  },
  getRestaurant: async (req, res, callback) => {
    const restaurant = await Restaurant.findByPk(req.params.id, {
      include: [Category,
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' },
        { model: Comment, include: [User] }
      ]
    })

    // handle restaurant data and check status
    restaurant.increment('viewCounts', { by: 1 })
    const isFavorited = restaurant.FavoritedUsers.map(d => d.id).includes(helpers.getUser(req).id)
    const isLiked = restaurant.LikedUsers.map(d => d.id).includes(helpers.getUser(req).id)

    const data = { restaurant: restaurant.toJSON(), isFavorited, isLiked }
    return callback(data)
  },
  getFeeds: (req, res, callback) => {
    return Promise.all([
      Restaurant.findAll({
        raw: true,
        nest: true,
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category]
      }),
      Comment.findAll({
        raw: true,
        nest: true,
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant]
      })
    ])
      .then(([restaurants, comments]) => {
        const data = { restaurants, comments }
        return callback(data)
      })
  },
  getDashboard: (req, res, callback) => {
    return Promise.all([
      Restaurant.findByPk(req.params.id, {
        include: [Category]
      }),
      Comment.count({
        where: { restaurantId: req.params.id }
      }),
      Favorite.count({
        where: { restaurantId: req.params.id }
      })
    ])
      .then(([restaurant, commentCounts, favoriteCounts]) => {
        const data = { restaurant: restaurant.toJSON(), commentCounts, favoriteCounts }
        return callback(data)
      })
  },
  getTopRestaurant: async (req, res, callback) => {
    let restaurants = await Restaurant.findAll({
      raw: true,
      subQuery: false,
      include: [
        { model: User, as: 'FavoritedUsers' }
      ],
      group: ['id'],
      order: [[Sequelize.literal('FavoriteCounts'), 'DESC']],
      attributes: [
        'id',
        'name',
        'image',
        'description',
        [Sequelize.fn('count', Sequelize.col('FavoritedUsers.id')), 'FavoriteCounts']
      ],
      limit: 10
    })
    // handle restaurants data and check favorite status
    restaurants = restaurants.map(restaurant => ({
      ...restaurant,
      description: restaurant.description.slice(0, 50),
      isFavorited: restaurant['FavoritedUsers.id'] === helpers.getUser(req).id
    }))

    const data = { restaurants }
    return callback(data)
  }
}

module.exports = restService
