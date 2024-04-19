var express = require('express');
var router = express.Router();
const users = require('../Model/user');
const db = require('../db');
// const users = require('./users')
const upload = require('./multer');
var passport = require('passport')
var localStrategy = require('passport-local')
passport.use(new localStrategy(users.authenticate()));

/* GET home page. */
router.get('/', isloggedIn, async function (req, res, next) {
  const loggedInUser = req.user;
  console.log(req.user);
  res.render('index',{loggedInUser});
});

router.post('/register', (req, res, next) => {
  var newUser = {
    username: req.body.username
  };
  users.register(newUser, req.body.password).then((result) => {
      passport.authenticate('local')(req, res, () => {
        //destination after user register
        res.redirect('/');
      });
    }).catch((err) => {
      res.send(err);
    });
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
}),
  (req, res, next) => { }
);

router.get('/register',function(req,res,next){
  res.render('register');
});

router.get('/login',function(req,res,next){
  res.render('login');
})

router.get('/edit', isloggedIn, async function(req,res,next){
  const user = await users.findOne({ username: req.session.passport.user });
  res.render('edit', {user: user});
});

router.post('/upload/profilepic', isloggedIn, upload.single("image"), async function (req, res) {
  const user = await users.findOne({ username: req.session.passport.user });
  if (req.file) {
    user.profileImage = req.file.filename;
  }

  await user.save();
  res.redirect('/');
});

router.post('/update', isloggedIn, async function (req, res) {
  const user = await users.findOneAndUpdate(
    { username: req.session.passport.user },
    { username: req.body.username},
    { new: true }
  );

  req.logIn(user, function (err) {
   if (err) throw err;
   res.redirect("/");
  });

});

router.get('/logout', (req, res, next) => {
  if (req.isAuthenticated())
    req.logout((err) => {
      if (err) res.send(err);
      else res.redirect('/');
    });
  else {
    res.redirect('/');
  }
});

function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  else res.redirect('/login');
};

module.exports = router;
