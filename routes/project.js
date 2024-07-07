const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { ensureAuth, ensureAdmin, ensureAdminOrWorker } = require('../middleware/auth')

const Project = require('../models/Project');

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploadProjects');
    },
    filename: function (req, file, cb) {
        var ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

const upload = multer({ storage: storage });


// @desc Show add Projects page
// @route GET /Projects/addProjects
router.get('/addProjects', ensureAuth, ensureAdminOrWorker, (req, res) => {
    res.render('Projects/addProjects', {
        title: 'Projects Page',
        layout: 'admin',
    });
});


// @desc Process add Projects form with image upload
// @route POST /Projects
router.post('/', ensureAuth, ensureAdminOrWorker, upload.single('image'), async (req, res) => {
    try {
        const file = req.file;

        if (!file || file.length === 0) {
            const error = new Error('Please choose files');
            error.httpStatusCode = 400;
            throw error;
        }

        const img = fs.readFileSync(file.path);
        const encode_image = img.toString('base64');

        const newUpload = new Projects({
            ...req.body,
            user: req.user.id,
            contentType: file.mimetype,
            imageBase64: encode_image,
        });

        try {
            await newUpload.save();
            res.redirect('/Projects');
            console.log("New Projects with image/upload is Registered");

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


// @desc Show all Projects
// @route GET /Projects/index
router.get('/', async (req, res) => {
    try {
        const Projects = await Projects.find()
            .populate('user')
            .sort({ createdAt: -1 })
            .lean();

        res.render('Projects/index', {
            Projects,

        });
        console.log("You can now see All Projects Here !");
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});


// @desc    Show single Projects
// @route   GET /Projects/:id
router.get('/:id', ensureAuth, ensureAdminOrWorker, async (req, res) => {
    try {
        let Projects = await Projects.findById(req.params.id)
            .populate('user')
            .lean()

        if (!Projects) {
            return res.render('error/404')
        }

        if (Projects.user._id != req.user.id) {
            res.render('error/404')
        } else {
            res.render('Projects/show', {
                Projects,
                layout: 'admin',
            })
        }
        console.log("You can now see the Projects details");
    } catch (err) {
        console.error(err)
        res.render('error/404')
    }
})



// @desc Show edit page
// @route GET /Projects/edit/:id
router.get('/edit/:id', ensureAuth, ensureAdminOrWorker, async (req, res) => {
    try {
        const Projects = await Projects.findById(req.params.id).lean();

        if (!Projects) {
            return res.render('error/404');
        }

        if (Projects.user.toString() !== req.user.id) {
            return res.redirect('/Projects');
        } else {
            res.render('Projects/edit', {
                Projects,
                layout: 'admin',
            });
        }
        console.log("You are in Projects/edit page & can Edit this Projects info");
    } catch (err) {
        console.error(err);
        return res.render('error/500');
    }
});


// @desc Show Update page
// @route POST /Projects/:id
router.post('/:id', ensureAuth, upload.single('image'), async (req, res) => {
    try {
        let Projects = await Projects.findById(req.params.id).lean();

        if (!Projects) {
            console.log('Projects not found');
            return res.render('error/404');
        }

        if (String(Projects.user) !== req.user.id) {
            console.log('User not authorized');
            return res.redirect('/Projects'), {
                layout: 'admin',
            }
        }

        const file = req.file;
        const existingImage = Projects.imageBase64;

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
                contentType: Projects.contentType,
                imageBase64: existingImage,
            };
        }

        // Use await here
        Projects = await Projects.findOneAndUpdate(
            { _id: req.params.id },
            updatedFields,
            { new: true, runValidators: true }
        );

        console.log('Projects updated successfully');
        res.redirect('/Projects');
    } catch (err) {
        console.error(err);
        return res.render('error/500');
    }
});




// @desc Delete Projects
// @route DELETE /Projects/:id
router.delete('/:id', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        let Projects = await Projects.findById(req.params.id).lean();

        if (!Projects) {
            return res.render('error/404');
        }

        if (Projects.user != req.user.id) {
            res.redirect('/Projects');
        } else {
            await Projects.deleteOne({ _id: req.params.id });
            res.redirect('/Projects');
        }
        console.log("Projects Deleted Successfully !");

    } catch (err) {
        console.error(err);
        return res.render('error/500');
    }
});



// @desc User Projects
// @route GET /Projects/user/:userId
router.get('/user/:userId', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const Projects = await Projects.find({
            user: req.params.userId,
        }).populate('user').lean();

        res.render('Projects/index', {
            Projects,
            layout: 'admin',
        });
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});



//@desc Search Projects by title
//@route GET /Projects/search/:query
router.get('/search/:query', ensureAuth, ensureAdminOrWorker, async (req, res) => {
    try {
        const Projects = await Projects.find({ name: new RegExp(req.query.query, 'i') })
            .populate('user')
            .sort({ createdAt: 'desc' })
            .lean();
        res.render('Projects/index', {
            Projects,
            layout: 'admin',
        });
        console.log("Search is working !");
    } catch (err) {
        console.log(err);
        res.render('error/404');
    }
});


module.exports = router;