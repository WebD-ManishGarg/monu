var express= require ("express");
var app=express();
var mongoose=require("mongoose");
var passport=require("passport");
var passportlocalmongoose=require("passport-local-mongoose");
var passportlocal=require("passport-local");
var bodyParser=require("body-parser");
var methodOverride=require("method-override");


mongoose.connect("mongodb://localhost:27017/blogs");

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
 });


// user schema
var Userschema=new mongoose.Schema({
    username:String,
    password:String
});
Userschema.plugin(passportlocalmongoose);
var User=mongoose.model("User",Userschema);

// blog schema
var blogschema=new mongoose.Schema({
    title:String,
    image:String,
    text:String,
    author: {
        id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"
        },
        username: String
     },
});

 var Blog=mongoose.model("Blog",blogschema);


 // for general services
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));


// for authentication
app.use(require("express-session")({
    secret: "Rusty is the best and cutest dog in the world",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportlocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




// Blog.create({
//     title: "FIRST BLOG",
//     image: "/images/img1.jpg",
//     text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
// });



//routes
app.get("/",function(req,res){
    res.render("landing");
})


//index page
app.get("/blog",function(req,res){
    Blog.find({},function(err,blog){
        res.render("index",{blog});
    })
     
});


//new blog route
app.get("/blog/new",isLoggedIn,function(req,res){
    res.render("new");
});


//show blog route
app.get("/blog/:id",function(req,res){
    Blog.findById(req.params.id,function(err,blog){
        if (err){
            console.log(err);
            res.redirect("back");
        }else{
            res.render("show",{blog});
        }
        
    });
});
 

//post new blog route
app.post("/blog",isLoggedIn,function(req,res){
    var title = req.body.title;
    var image = req.body.image;
    var text = req.body.text;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newCampground = {title: title, image: image, text: text, author:author}
      Blog.create(newCampground,function(err,blog){
        if (err){
            console.log(err);
            res.redirect("back");
        }else{
            res.redirect("/blog");
        }
     
      });
});



//edit blog route
app.get("/blog/:id/edit",author1,function(req,res){
    Blog.findById(req.params.id,function(err,blog){
        if (err){
            console.log(err);
            res.redirect("back");
        }else{
            res.render("edit",{blog});
        }
        
    });
        
});


//update blog route
app.put("/blog/:id",author1,function(req,res){
    Blog.findByIdAndUpdate(req.params.id,req.body.blog,function(err,blog){
        if (err){
            console.log(err);
            res.redirect("back");
        }else{
            res.redirect("/blog/"+req.params.id);
        }
       
    });
});


//delete blog route
app.delete("/blog/:id",author1,function(req,res){
    Blog.findByIdAndRemove(req.params.id,function(err,blogs){
        if (err){
            console.log(err);
            res.redirect("back");
        }else{
            res.redirect("/blog");
        }
      
    });
});


//signup route
app.get("/register",function(req,res){
    res.render("signup");
});


    app.post("/signup", function(req, res){
        User.register(new User({username: req.body.username}), req.body.password, function(err, user){
            if(err){
                console.log(err);
                return res.render('signup');
            }
            passport.authenticate("local")(req, res, function(){
               res.redirect("/blog");
            });
        });
    });

//login route
app.get("/login", function(req, res){
    res.render("login"); 
 });


 //post login route
 app.post("/login", passport.authenticate("local", {
     successRedirect: "/blog",
     failureRedirect: "/login"
 }) ,function(req, res){
 });
 
 //logout route
 app.get("/logout", function(req, res){
     req.logout();
     res.redirect("/");
 });
 
 // middleware for checking user login 
 function isLoggedIn(req, res, next){
     if(req.isAuthenticated()){
         return next();
     }
     res.redirect("/login");
 }


 //middleware for checking authorised user
function author1(req,res,next){
    if(req.isAuthenticated()){
        Blog.findById(req.params.id, function(err,blog){
           if(err){
               res.redirect("back");
           }  else {
               // does user own the comment?
            if(blog.author.id.equals(req.user._id)) {
                next();
        } else {
                    res.redirect("back");
                }
           }
        });
    }  else {
                res.redirect("back");
            }
}
 

app.listen(3000,function(){
    console.log("server is started .............")
})