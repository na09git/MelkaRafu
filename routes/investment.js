const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path')
const { ensureAuth } = require('../middleware/auth');

const Investment = require('../models/Investment')


// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploadinvestment');
  },
  filename: function (req, file, cb) {
    var ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});

const upload = multer({ storage: storage });



// @desc    Show add page
// @route   GET /investment/add
// Inside your '/investment/add' route
router.get('/add', ensureAuth, (req, res) => {
  try {
    console.log('Reached /investment/add route');
    res.render('investment/add', {
      layout: 'admin',
    });
  } catch (error) {
    console.error('Error rendering template:', error);
    res.status(500).send('Internal Server Error');
  }
});



// @desc Process add investment form with image upload
// @route POST /investment
router.post('/', ensureAuth, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;

    if (!file || file.length === 0) {
      const error = new Error('Please choose image ');
      error.httpStatusCode = 400;
      throw error;
    }

    const img = fs.readFileSync(file.path);
    const encode_image = img.toString('base64');

    const newUpload = new Investment({
      ...req.body,
      user: req.user.id,
      contentType: file.mimetype,
      imageBase64: encode_image,
    });

    try {
      await newUpload.save();
      res.redirect('/investment', {
      });
      console.log("New investment with image/upload is Posted");

    } catch (error) {
      if (error.name === 'MongoError' && error.code === 11000) {
        return res.status(400).json({ error: `Duplicate ${file.originalname}. File Already exists! ` });
      }
      return res.status(500).json({ error: error.message || `Cannot Upload ${file.originalname} Something Missing!` });
    }
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Internal Server Error' });
  }
});




// @desc Show all investment
// @route GET /investment/index
router.get('/', async (req, res) => {
  try {
    const investment = await Investment.find()
      .populate('user')
      .sort({ createdAt: -1 })
      .lean();

    res.render('investment/index', {
      investment,
      layout: 'admin',
    });
    console.log("You can now see All investment Here !");
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});


// @desc    Show single investment
// @route   GET /investment/:id
router.get('/:id', async (req, res) => {
  try {
    let investment = await Investment.findById(req.params.id)
      .populate('user')
      .lean()


    res.render('investment/show', {
      investment,
      layout: 'admin',
    })

    console.log("You can now see the investment details");
  } catch (err) {
    console.error(err)
    res.render('error/404')
  }
})




// @desc Show edit page
// @route GET /investment/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id).lean();

    if (!investment) {
      return res.render('error/404');
    }

    if (investment.user.toString() !== req.user.id) {
      return res.redirect('/investment');
    } else {
      res.render('investment/edit', {
        investment,
        layout: 'admin',
      });
    }
    console.log("You are in storie/edit page & can Edit this investment info");
  } catch (err) {
    console.error(err);
    return res.render('error/500');
  }
});



// @desc Show Update page
// @route POST /investment/:id
router.post('/:id', ensureAuth, upload.single('image'), async (req, res) => {
  try {
    let investment = await Investment.findById(req.params.id).lean();

    if (!investment) {
      console.log('investment not found');
      return res.render('error/404');
    }

    if (String(investment.user) !== req.user.id) {
      console.log('User not authorized');
      return res.redirect('/investment', {
        layout: 'admin',
      });
    }

    const file = req.file;
    const existingImage = investment.imageBase64;

    let updatedFields = req.body;

    if (file) {
      const img = fs.readFileSync(file.path);
      const encode_image = img.toString('base64');
      updatedFields = {
        ...updatedFields,
        contentType: file.mimetype,
        imageBase64: encode_image,
      };
    } else {
      updatedFields = {
        ...updatedFields,
        contentType: investment.contentType,
        imageBase64: existingImage,
      };
    }

    // Use await here
    investment = await Investment.findOneAndUpdate(
      { _id: req.params.id },
      updatedFields,
      { new: true, runValidators: true }
    );

    console.log('investment updated successfully');
    res.redirect('/investment');
  } catch (err) {
    console.error(err);
    return res.render('error/500');
  }
});


// @desc Delete investment
// @route DELETE /investment/:id
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    let investment = await Investment.findById(req.params.id).lean();

    if (!investment) {
      return res.render('error/404');
    }

    if (investment.user != req.user.id) {
      res.redirect('/investment', {
        layout: 'admin',
      });
    } else {
      await investment.deleteOne({ _id: req.params.id });
      res.redirect('/investment', {
        layout: 'admin',
      });
    }
    console.log("investment Deleted Successfully !");

  } catch (err) {
    console.error(err);
    return res.render('error/500');
  }
});



// @desc User investment
// @route GET /investment/user/:userId
router.get('/user/:userId', ensureAuth, async (req, res) => {
  try {
    const investment = await Investment.find({
      user: req.params.userId,
    }).populate('user').lean();

    res.render('investment/index', {
      investment,
      layout: 'admin',
    });
  } catch (err) {
    console.error(err);
    res.render('error/500');
  }
});


//@desc Search investment by title
//@route GET /investment/search/:query
router.get('/search/:query', async (req, res) => {
  try {
    const investment = await Investment.find({ title: new RegExp(req.query.query, 'i') })
      .populate('user')
      .sort({ createdAt: 'desc' })
      .lean();
    res.render('investment/index', {
      investment,
      layout: 'admin',
    });
    console.log("Search is working !");
  } catch (err) {
    console.log(err);
    res.render('error/404');
  }
});


module.exports = router