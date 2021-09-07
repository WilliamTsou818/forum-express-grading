const commentService = require('../services/commentService')

const commentController = {
  postComment: (req, res) => {
    commentService.postComment(req, res, (data) => {
      req.flash('success_messages', data.message)
      return res.redirect(`/restaurants/${req.body.restaurantId}`)
    })
  },
  deleteComment: (req, res) => {
    commentService.deleteComment(req, res, (data) => {
      req.flash('success_messages', data.message)
      return res.redirect(`/restaurants/${data.restaurantId}`)
    })
  }
}
module.exports = commentController
