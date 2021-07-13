const db = require('../models')
const Category = db.Category
const categoryService = require('../services/categoryService')

const categoryController = {
  getCategories: (req, res) => {
    categoryService.getCategories(req, res, (data) => {
      return res.render('admin/categories', data)
    })
  },
  postCategory: (req, res) => {
    if (!req.body.name) {
      req.flash('error_messages', '請輸入有效內容')
      return res.redirect('back')
    }
    return Category.findOne({ where: { name: req.body.name } })
      .then(category => {
        if (category) {
          req.flash('error_messages', '該分類已存在')
          return res.redirect('back')
        }
        Category.create({
          name: req.body.name
        })
          .then(() => {
            req.flash('success_messages', '類別建立成功')
            return res.redirect('/admin/categories')
          })
      })
  },
  putCategory: (req, res) => {
    if (!req.body.name) {
      req.flash('error_messages', '請輸入有效內容')
      return res.redirect('back')
    }
    return Category.findByPk(req.params.id)
      .then(category => {
        category.update(req.body)
          .then(() => {
            res.redirect('/admin/categories')
          })
      })
  },
  deleteCategory: (req, res) => {
    return Category.findByPk(req.params.id)
      .then(category => {
        category.destroy()
          .then(() => res.redirect('/admin/categories'))
      })
  }
}
module.exports = categoryController
