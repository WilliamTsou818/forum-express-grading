const db = require('../models')
const Category = db.Category

const categoryService = {
  getCategories: (req, res, callback) => {
    return Category.findAll({
      raw: true,
      nest: true
    }).then(categories => {
      if (req.params.id) {
        Category.findByPk(req.params.id)
          .then(category => {
            callback({
              categories: categories,
              category: category.toJSON()
            })
          })
      } else {
        callback({ categories: categories })
      }
    })
  },
  postCategory: (req, res, callback) => {
    if (!req.body.name) {
      return callback({ status: 'error', message: '請輸入有效內容' })
    }
    return Category.findOne({ where: { name: req.body.name } })
      .then(category => {
        if (category) {
          callback({ status: 'error', message: '該分類已存在' })
        }
        Category.create({
          name: req.body.name
        })
          .then(() => {
            callback({ status: 'success', message: '類別建立成功' })
          })
      })
  }
}

module.exports = categoryService
