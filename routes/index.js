const express = require('express')
const router = express.Router()
const { ensureAuth, ensureGuest, ensureAdmin, ensureAdminOrWorker } = require('../middleware/auth')

const User = require('../models/User')

const News = require('../models/News')

const Worker = require('../models/Worker')
const Project = require('../models/Project')
const Investment = require('../models/Investment')




// @desc    Login/Landing page
// @route   GET /login
router.get('/login', ensureGuest, (req, res) => {
  res.render('login', {
    layout: 'login',
  })
})


// @desc    home
// @route   GET /home
router.get('/', async (req, res) => {
  try {
    res.render('home')
    console.log("You are in /Page !");
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// @desc    home
// @route   GET /home
router.get('/home', async (req, res) => {
  try {
    res.render('home')
    console.log("You are in /homePage !");
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})


// @desc    admin
// @route   GET /admin
router.get('/admin', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    res.render('admin', {
      layout: 'admin',
      name: req.user.firstName,
      lastname: req.user.lastName,
      image: req.user.image,
    })
    console.log("You are in /Admin Page !");
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})


// @desc    homeworker
// @route   GET /homeworker
router.get('/homeworker', ensureAuth, ensureAdminOrWorker, async (req, res) => {
  try {
    res.render('homeworker', {
      layout: 'homeworker',
      name: req.user.firstName,
      image: req.user.image,
    })
    console.log("You are in /homeWorker Page !");
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})


// @desc    News
// @route   GET /news
router.get('/newspage', ensureAuth, async (req, res) => {
  try {
    const news = await News.find({ user: req.user.id }).lean()
    res.render('newspage', {
      layout: 'admin',
      name: req.user.firstName,
      image: req.user.image,
      news,
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})


// @desc    Worker
// @route   GET /worker
router.get('/workers', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const worker = await Worker.find({ user: req.user.id }).lean()
    res.render('workers', {
      layout: 'admin',
      name: req.user.firstName,
      image: req.user.image,
      worker,
    })
    console.log("Dear Admin, You can see all Worker here in this Page !")
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})




// @desc    rents
// @route   GET /investments
router.get('/investments', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const investment = await Investment.find({ user: req.user.id })
      .populate('user')
      .sort({ createdAt: -1 })
      .lean();

    res.render('investments', {
      name: req.user.firstName,
      image: req.user.image,
      investment,
      layout: 'admin',
    })
    console.log("Dear Admin, You can see all Investment here in this Page !")
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// @desc    projects
// @route   GET /projects
router.get('/projects', ensureAuth, async (req, res) => {
  try {
    const project = await Project.find({ user: req.user.id }).lean()
    res.render('projects', {
      name: req.user.firstName,
      image: req.user.image,
      project,
      layout: 'admin',
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

// @desc    profile
// @route   GET /profile
router.get('/profile', ensureAuth, async (req, res) => {
  try {
    res.render('profile', {
      layout: 'admin',

    })
    console.log("Dear Admin, You can see your  Profile here in this Page !")
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

module.exports = router