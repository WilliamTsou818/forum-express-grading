const express = require('express')
const router = express.Router()

const adminController = require('../controllers/api/adminController.js')
const categoryController = require('../controllers/api/categoryController')
const categoryService = require('../services/categoryService.js')

// admin restaurants
router.get('/admin/restaurants', adminController.getRestaurants)
router.get('/admin/restaurants/:id', adminController.getRestaurant)

// admin categories
router.get('/admin/categories', categoryController.getCategories)

module.exports = router
