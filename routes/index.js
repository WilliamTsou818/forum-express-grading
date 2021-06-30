const restController = require('../controllers/restController')
const adminController = require('../controllers/adminController')
const userController = require('../controllers/userController')
const passport = require('passport')
module.exports = (app) => {
  // index route
  app.get('/', (req, res) => res.redirect('/restaurants'))
  app.get('/restaurants', restController.getRestaurants)
  // admin route
  app.get('/admin', (req, res) => res.redirect('/admin/restaurants'))
  app.get('/admin/restaurants', adminController.getRestaurants)
  // signup route
  app.get('/signup', userController.signUpPage)
  app.post('/signup', userController.signUp)
  // signin route
  app.get('/signin', userController.signInPage)
  app.post('/signin', passport.authenticate('local', { failureRedirect: '/signin', failureFlash: true }), userController.signIn)
  // logout route
  app.get('/logout', userController.logout)
}
