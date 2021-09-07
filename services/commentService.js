const db = require('../models')
const Comment = db.Comment

const helpers = require('../_helpers')

const commentService = {
  postComment: async (req, res, callback) => {
    await Comment.findOrCreate({
      where: {
        text: req.body.text,
        RestaurantId: req.body.restaurantId,
        UserId: helpers.getUser(req).id
      },
      defaults: {
        text: req.body.text,
        RestaurantId: req.body.restaurantId,
        UserId: helpers.getUser(req).id
      }
    })

    const data = { status: 'success', message: '已成功建立評論' }
    return callback(data)
  },
  deleteComment: async (req, res, callback) => {
    const comment = await Comment.findByPk(req.params.id)
    await comment.destroy()
    const data = { status: 'success', message: '已成功刪除評論', restaurantId: comment.RestaurantId }
    return callback(data)
  }
}

module.exports = commentService
