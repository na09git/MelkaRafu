const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { ensureAuth, ensureAdmin, ensureAdminOrWorker } = require('../middleware/auth')

const Project = require('../models/Project');

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploadproject');
    },
    filename: function (req, file, cb) {
        var ext = file.originalname.substr(file.originalname.lastIndexOf('.'));
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

const upload = multer({ storage: storage });


// @desc Show add project page
// @route GET /project/addproject
router.get('/addproject', ensureAuth, ensureAdminOrWorker, (req, res) => {
    res.render('project/addproject', {
        title: 'project Page',
        layout: 'admin',
    });
});


// @desc Process add project form with image upload
// @route POST /project
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

        const newUpload = new Project({
            ...req.body,
            user: req.user.id,
            contentType: file.mimetype,
            imageBase64: encode_image,
        });

        try {
            await newUpload.save();
            res.redirect('/projects');
            console.log("New project with image/upload is Registered");

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


// @desc Show all projects
// @route GET /project/index
router.get('/', async (req, res) => {
    try {
        const project = await Project.find()
            .populate('user')
            .sort({ createdAt: -1 })
            .lean();

        res.render('project/index', {
            project,

        });
        console.log("You can now see All project Here !");
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});


// @desc    Show single project
// @route   GET /project/:id
router.get('/:id', ensureAuth, ensureAdminOrWorker, async (req, res) => {
    try {
        let project = await Project.findById(req.params.id)
            .populate('user')
            .lean()

        if (!project) {
            return res.render('error/404')
        }

        if (project.user._id != req.user.id) {
            res.render('error/404')
        } else {
            res.render('project/show', {
                project,
                layout: 'admin',
            })
        }
        console.log("You can now see the project details");
    } catch (err) {
        console.error(err)
        res.render('error/404')
    }
})



// @desc Show edit page
// @route GET /project/edit/:id
router.get('/edit/:id', ensureAuth, ensureAdminOrWorker, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).lean();

        if (!project) {
            return res.render('error/404');
        }

        if (project.user.toString() !== req.user.id) {
            return res.redirect('/projects');
        } else {
            res.render('project/edit', {
                project,
                layout: 'admin',
            });
        }
        console.log("You are in project/edit page & can Edit this project info");
    } catch (err) {
        console.error(err);
        return res.render('error/500');
    }
});


// @desc Show Update page
// @route POST /project/:id
router.post('/:id', ensureAuth, upload.single('image'), async (req, res) => {
    try {
        let project = await Project.findById(req.params.id).lean();

        if (!project) {
            console.log('project not found');
            return res.render('error/404');
        }

        if (String(project.user) !== req.user.id) {
            console.log('User not authorized');
            return res.redirect('/project'), {
                layout: 'admin',
            }
        }

        const file = req.file;
        const existingImage = project.imageBase64;

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
                contentType: project.contentType,
                imageBase64: existingImage,
            };
        }

        // Use await here
        project = await Project.findOneAndUpdate(
            { _id: req.params.id },
            updatedFields,
            { new: true, runValidators: true }
        );

        console.log('project updated successfully');
        res.redirect('/project');
    } catch (err) {
        console.error(err);
        return res.render('error/500');
    }
});




// @desc Delete project
// @route DELETE /project/:id
router.delete('/:id', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        let project = await Project.findById(req.params.id).lean();

        if (!project) {
            return res.render('error/404');
        }

        if (project.user != req.user.id) {
            res.redirect('/projects');
        } else {
            await project.deleteOne({ _id: req.params.id });
            res.redirect('/projects');
        }
        console.log("project Deleted Successfully !");

    } catch (err) {
        console.error(err);
        return res.render('error/500');
    }
});



// @desc User project
// @route GET /project/user/:userId
router.get('/user/:userId', ensureAuth, ensureAdmin, async (req, res) => {
    try {
        const project = await Project.find({
            user: req.params.userId,
        }).populate('user').lean();

        res.render('project/index', {
            project,
            layout: 'admin',
        });
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});



//@desc Search project by title
//@route GET /project/search/:query
router.get('/search/:query', ensureAuth, ensureAdminOrWorker, async (req, res) => {
    try {
        const project = await Project.find({ name: new RegExp(req.query.query, 'i') })
            .populate('user')
            .sort({ createdAt: 'desc' })
            .lean();
        res.render('project/index', {
            project,
            layout: 'admin',
        });
        console.log("Search is working !");
    } catch (err) {
        console.log(err);
        res.render('error/404');
    }
});


module.exports = router;