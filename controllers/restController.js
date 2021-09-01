const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User
const Favorite = db.Favorite

const pageLimit = 10
const helpers = require('../_helpers')

const restController = {
  getRestaurants: (req, res) => {
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
    Restaurant.findAndCountAll({
      raw: true,
      nest: true,
      include: [Category],
      where: whereQuery,
      offset: offset,
      limit: pageLimit
    })
      .then(result => {
        // page data
        const page = Number(req.query.page) || 1
        const pages = Math.ceil(result.count / pageLimit)
        const totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
        const prev = page - 1 < 1 ? 1 : page - 1
        const next = page + 1 > pages ? pages : page + 1

        // restaurant data
        const restaurantData = result.rows.map(r => ({
          ...r,
          description: r.description.substring(0, 50),
          categoryName: r.Category.name,
          isFavorited: helpers.getUser(req).FavoritedRestaurants.map(d => d.id).includes(r.id),
          isLiked: helpers.getUser(req).LikedRestaurants.map(d => d.id).includes(r.id)
        }))
        Category.findAll({ raw: true, nest: true }).then(categories => {
          return res.render('restaurants', {
            restaurants: restaurantData,
            categories,
            categoryId,
            page,
            totalPage,
            prev,
            next
          })
        })
      })
  },
  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [Category,
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' },
        { model: Comment, include: [User] }
      ]
    })
      .then(restaurant => {
        restaurant.increment('viewCounts', { by: 1 })
        const isFavorited = restaurant.FavoritedUsers.map(d => d.id).includes(helpers.getUser(req).id)
        const isLiked = restaurant.LikedUsers.map(d => d.id).includes(helpers.getUser(req).id)
        res.render('restaurant', {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
  },
  getFeeds: (req, res) => {
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
        return res.render('feeds', {
          restaurants,
          comments
        })
      })
  },
  getDashboard: (req, res) => {
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
        return res.render('dashboard', {
          restaurant: restaurant.toJSON(),
          commentCounts,
          favoriteCounts
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

module.exports = restController
