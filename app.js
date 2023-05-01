if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require("express");
const path = require('path');
const morgan = require("morgan");
const ejs = require("ejs");
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const methodOverride = require("method-override");
const multer = require("multer");
require('./services/config/passport')(passport);
const Property = require("./services/models/properties");
const Land = require("./services/models/land");
const Blog = require("./services/models/blog");
const Admin = require("./services/models/admin");
const Staff = require('./services/models/staff');
const About = require('./services/models/about');
const Service = require('./services/models/services');
const Subscriber = require('./services/models/subscriber');
const Testimony = require('./services/models/testimoniy');
// const transporter = require('./services/config/nodemailer');
const nodemailer = require('nodemailer')
const smtpPool = require('nodemailer-smtp-pool');



const PORT = process.env.PORT || 5000;
const SECRET = process.env.SESSION_SECRET;
const connectDB = require('./services/database/connection');
const PASSWORD_EMAIL = process.env.PASSWORD_EMAIL;
connectDB();

const app = express();
app.use(morgan('tiny'));
app.use(cors());

//body parser
app.set("view engine", "ejs");
app.use(express.urlencoded( { extended : true } ));
app.use(express.json());
app.use(flash());

app.use(
    session( {
        secret: SECRET,
        resave: false,
        saveUninitialized: true,
        cookies: { maxAge: 60 * 60 * 1000 } // 1 hour
    } )
);

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
  });

  app.use('/animated.css/animate.min.css', (req, res, next) => {
    res.setHeader('Content-Type', 'text/css');
    next();
  });

  app.use('/bootstrap/css/', (req, res, next) => {
    res.setHeader('Content-Type', 'text/css');
    next();
  });

app.use('/css', express.static(path.resolve(__dirname, "assets/css")));
app.use('/img', express.static(path.resolve(__dirname, "assets/img")));
app.use('/js', express.static(path.resolve(__dirname, "assets/js")));
app.use('/animate.css/animate.min.css', express.static(path.resolve(__dirname, "assets/vendor/animate.css/animate.min.css")));
app.use('/bootstrap/css', express.static(path.resolve(__dirname, "assets/vendor/bootstrap/css")));
app.use('/bootstrap/js/', express.static(path.resolve(__dirname, "assets/vendor/bootstrap/js")));
app.use('/bootstrap-icons', express.static(path.resolve(__dirname, "assets/vendor/bootstrap-icons")));
app.use('/fonts', express.static(path.resolve(__dirname, "assets/vendor/bootstrap-icons/fonts")));
app.use('/php-email-form', express.static(path.resolve(__dirname, "assets/vendor/php-email-form")));
app.use('/swiper', express.static(path.resolve(__dirname, "assets/vendor/swiper")));


// app.use(express.static("."));
app.use((error, req, res, next) => {
    console.log("This is the rejected field ->", error.field);
  });
  
  app.use( (req, res, next) =>{
  
  res.header("Access-Control-Allow-origin", "*" , "fonts.googleapis.com", "fonts.gstatic.com")
  
  res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE")
  
  res.header("Access-Control-Allow-Headers", "Origin",
  
  "X-Requested-With", "Content-Type", "Accept")
  
  next()
  });

  app.use('/admin', require('./services/routes/admin'));
  app.use('/', require('./services/routes/index'));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  
  const upload = multer({ storage: storage });
  
  const ensureAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/admin/login');
  
  }
  
  const forwardAuthenticated = function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/admin/dashboard');     
  }
  //creating property
  const uploadMultiple = upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'img2', maxCount: 1 },
    { name: 'floor_plan', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]);
  
  app.post("/create-property",ensureAuthenticated, uploadMultiple, async (req, res) => {
    try {
      const {
        property_id,
        name,
        location,
        status,
        area,
        bed,
        baths,
        garage,
        amenities,
        description,
        period
      } = req.body;
  
      //generate property code
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let voucherCode = '';
      for (let i = 0; i < 4; i++) {
        voucherCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      const codes = voucherCode;
  
      const errors = [];
  
      if (
        !name ||
        !location ||
        !status ||
        !area ||
        !bed ||
        !baths ||
        !garage ||
        !amenities ||
        !description ||
        !period
      ) {
        errors.push({ msg: "Please fill in all fields." });
      }
      if (errors.length > 0) {
        res.render('create_housing', {
          errors: errors,
          name: name,
          user: req.user,
          location: location,
          status: status,
          area: area,
          bed: bed,
          baths: baths,
          garage: garage,
          amenities: amenities,
          description: description,
          period: period,
          user: req.user,
        });
      } else {
            Property.findOne({ property_id : property_id})
            .then((prop) => {
                if(!prop) {
                    const property ={
                        property_id: voucherCode,
                        name: name,
                        location: location,
                        status: status,
                        area: area,
                        bed: bed,
                        baths: baths,
                        garage: garage,
                        amenities: amenities.split(',').map(armenity => armenity.trim()),
                        description: description,
                        period: period,
                          img: {},
                          img2: {},
                          floor_plan: {},
                          video: {},
                      };
              
                      if (req.files['img']) {
                          property.img = {
                            data: fs.readFileSync(
                              path.join(__dirname + "/uploads/" + req.files['img'][0].filename)
                            ),
                            contentType: req.files['img'][0].mimetype,
                          };
                        }
                        if (req.files['img2']) {
                          property.img2 = {
                            data: fs.readFileSync(
                              path.join(__dirname + "/uploads/" + req.files['img2'][0].filename)
                            ),
                            contentType: req.files['img2'][0].mimetype,
                          };
                        }
                        if (req.files['floor_plan']) {
                          property.floor_plan = {
                            data: fs.readFileSync(
                              path.join(__dirname + "/uploads/" + req.files['floor_plan'][0].filename)
                            ),
                            contentType: req.files['floor_plan'][0].mimetype,
                          };
                        }
                        if (req.files['video']) {
                          property.video = {
                            data: fs.readFileSync(
                              path.join(__dirname + "/uploads/" + req.files['video'][0].filename)
                            ),
                            contentType: req.files['video'][0].mimetype,
                          };
                        }
              
                      Property.create(property)
                                      .then((data) => {
                                          req.flash("success_msg", "Data Registered !");
                                          res.redirect('/admin/create-housing');
                                      }).catch((err) => {
                                          console.log(err)
                                      })
                        
                }else {
                    if (prop) {
                        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let voucherCode = '';
                        for (let i = 0; i < 4; i++) {
                          voucherCode += characters.charAt(Math.floor(Math.random() * characters.length));
                        }
                        const codes = voucherCode;

                        const property ={
                            property_id: voucherCode,
                            name: name,
                            location: location,
                            status: status,
                            area: area,
                            bed: bed,
                            baths: baths,
                            garage: garage,
                            amenities: amenities.split(',').map(armenity => armenity.trim()),
                            description: description,
                            period: period,
                              img: {},
                              img2: {},
                              floor_plan: {},
                              video: {},
                          };
                  
                          if (req.files['img']) {
                              property.img = {
                                data: fs.readFileSync(
                                  path.join(__dirname + "/uploads/" + req.files['img'][0].filename)
                                ),
                                contentType: req.files['img'][0].mimetype,
                              };
                            }
                            if (req.files['img2']) {
                              property.img2 = {
                                data: fs.readFileSync(
                                  path.join(__dirname + "/uploads/" + req.files['img2'][0].filename)
                                ),
                                contentType: req.files['img2'][0].mimetype,
                              };
                            }
                            if (req.files['floor_plan']) {
                              property.floor_plan = {
                                data: fs.readFileSync(
                                  path.join(__dirname + "/uploads/" + req.files['floor_plan'][0].filename)
                                ),
                                contentType: req.files['floor_plan'][0].mimetype,
                              };
                            }
                            if (req.files['video']) {
                              property.video = {
                                data: fs.readFileSync(
                                  path.join(__dirname + "/uploads/" + req.files['video'][0].filename)
                                ),
                                contentType: req.files['video'][0].mimetype,
                              };
                            }
                  
                          Property.create(property)
                                          .then((data) => {
                                              req.flash("success_msg", "Data Registered !");
                                              res.redirect('/admin/create-housing');
                                          }).catch((err) => {
                                              console.log(err)
                                          })
                    }
                }
            })
        
      }
    } catch (error) {

      console.log(error);

    }
  });



  //updating Images
  const uploadMultipleImages = upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'img2', maxCount: 1 },
    { name: 'floor_plan', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ], function (err) {
    if (err) {
      console.log(err);
      // Handle the error here
    }
  });


//edit Property's images
app.post("/edit-property-image/:id", uploadMultipleImages, async (req, res) => {
  try {
    const propertyId = req.params.id;

    if (!propertyId) {
      throw new TypeError("Invalid property ID");
    }

    const property = {};

    if (req.files['img']) {
        property.img = {
          data: fs.readFileSync(
            path.join(__dirname + "/uploads/" + req.files['img'][0].filename)
          ),
          contentType: req.files['img'][0].mimetype,
        };
      }
      if (req.files['img2']) {
        property.img2 = {
          data: fs.readFileSync(
            path.join(__dirname + "/uploads/" + req.files['img2'][0].filename)
          ),
          contentType: req.files['img2'][0].mimetype,
        };
      }
      if (req.files['floor_plan']) {
        property.floor_plan = {
          data: fs.readFileSync(
            path.join(__dirname + "/uploads/" + req.files['floor_plan'][0].filename)
          ),
          contentType: req.files['floor_plan'][0].mimetype,
        };
      }
      if (req.files['video']) {
        property.video = {
          data: fs.readFileSync(
            path.join(__dirname + "/uploads/" + req.files['video'][0].filename)
          ),
          contentType: req.files['video'][0].mimetype,
        };
      }

    const filter = { _id: propertyId };
    const update = { $set: property };
    const options = { returnOriginal: false };

    const result = await Property.findOneAndUpdate(filter, update, options);

    if (!result) {
      return res.status(404).json({ error: "Property not found" });
    }
    req.flash("success_msg", "Images Uploaded");
    return res.redirect('/admin/edit-property?id=' + propertyId);
  } catch (error) {
    if (error.name === "CastError" || error.name === "TypeError") {
      return res.status(400).json({ error: error.message });
    }
    console.log(error);
    return res.status(500).send();
  }
});


   // creating blog
//Multer Middleware

const uploadMultipleBlog = upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'img2', maxCount: 1 },
  ], function (err) {
    if (err) {
      console.log(err);
      // Handle the error here
    }
  });

app.post('/create-blog',ensureAuthenticated, uploadMultipleBlog, async (req, res) => {
  try {
   const {fullname, category, article, topic} = req.body;
   const errors = [];

   if (!fullname || !category || !article || !topic) {
       errors.push( { msg : "Please fill in all the fields."} )
   }
   if (errors.length > 0) {
       res.render('create_blog', {
          errors: errors,
          fullname: fullname,
          category: category, 
          article: article, 
          topic: topic, 
          user: req.user,
       })
   } else{
      
      const blog = {
          fullname: fullname,
          category: category, 
          article: article, 
          topic: topic, 
          img: {},
          img2: {},
      } 

      
      if (req.files['img']) {
        blog.img = {
          data: fs.readFileSync(
            path.join(__dirname + "/uploads/" + req.files['img'][0].filename)
          ),
          contentType: req.files['img'][0].mimetype,
        };
      }
      if (req.files['img2']) {
        blog.img2 = {
          data: fs.readFileSync(
            path.join(__dirname + "/uploads/" + req.files['img2'][0].filename)
          ),
          contentType: req.files['img2'][0].mimetype,
        };
      }

      Blog.create(blog)
      .then((data) => {
         
          req.flash("success_msg", "Data Registered !");
          res.redirect('/admin/create-blog');
      }).catch((err) => {
          console.log(err)
      }).catch((err) => console.log (err))
  }

  } catch (error) {
       console.log (error)
  }
} )



const uploadMultipleBlogs = upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'img2', maxCount: 1 },
  ], function (err) {
    if (err) {
      console.log(err);
      // Handle the error here
    }
  });

app.post("/edit-blog-image/:id", uploadMultipleBlogs, async(req, res, next) => {
    try {
        const blogId = req.params.id;

        if (!blogId) {
          throw new TypeError("Invalid blog ID");
        }
    
        const blog = {};
    
        if (req.files['img']) {
            blog.img = {
              data: fs.readFileSync(
                path.join(__dirname + "/uploads/" + req.files['img'][0].filename)
              ),
              contentType: req.files['img'][0].mimetype,
            };
          }
          if (req.files['img2']) {
            blog.img2 = {
              data: fs.readFileSync(
                path.join(__dirname + "/uploads/" + req.files['img2'][0].filename)
              ),
              contentType: req.files['img2'][0].mimetype,
            };
          }
    
        const filter = { _id: blogId };
        const update = { $set: blog };
        const options = { returnOriginal: false };
    
        const results = await Blog.findOneAndUpdate(filter, update, options);
    
        if (!results) {
          return res.status(404).json({ error: "blog not found" });
        }
        req.flash("success_msg", "Images Uploaded");
        return res.redirect('/admin/edit-blog?id=' + blogId);
    } catch (error) {
        if (error.name === "CastError" || error.name === "TypeError") {
            return res.status(400).json({ error: error.message });
          }
          console.log(error);
          return res.status(500).send();
    }
 } )



// creating Admin
const uploadSingleAdminImage = upload.single("img");

app.post('/create-admins',ensureAuthenticated, uploadSingleAdminImage , async(req, res, next) => {
    try {
        const { first_name, second_name, position, password, password2, email, role} = req.body;
        const errors = [];
      
        if (!first_name || !second_name || !position || !password || !password2 || !email || !role) {
            errors.push( { msg : "Please fill in all fields." } );
        }
        if (password !== password2) {
            errors.push( { msg : "Password not match." } );
        }
        if (password.length < 8) {
            errors.push({ msg: "password atleast 8 character" });
          }
        if(errors.length > 0){
            res.render('create_admin', {
                errors: errors,
                first_name: first_name,
                second_name: second_name,
                position: position,
                role: role,
                password: password,
                password2: password2,
                email: email,
                user: req.user,
      
            } )
        }else{
            Admin.findOne( { email: email } )
                      .then((user) => {
               
                if(user) {
                    errors.push( { msg: "The email provided already associated with an existing User" } );
                    res.render('create_admin', {
                        errors: errors,
                        first_name: first_name,
                        second_name: second_name,
                        position: position,
                        role: role,
                        password: password,
                        password2: password2,
                        email: email,
                        user: req.user,
                    } )
                }
                else if (!user) {
                      const newAdmin = new Admin ({
                          first_name: first_name,
                          second_name: second_name,
                          position: position,
                          role: role,
                          password: password,
                          password2: password2,
                          email: email,
                          img: img = {
                              data: fs.readFileSync(
                                  path.join( __dirname + "/uploads/" + req.file.filename)
                              ),
                              contentType: "image/png",
                              },
                      });
                      
                      bcrypt.genSalt(10, (err, salt) =>
                      bcrypt.hash(newAdmin.password, salt,
                          (err, hash) => {
                              if (err) throw err;
        
                              newAdmin.password = hash;
        
                              newAdmin.save()
                                  .then((value) => {
                                      console.log(value)
                                      req.flash(
                                        "success_msg",
                                        "An Admin Registered Successfully!"
                                      );
                                      res.redirect("/admin/create-admin");
                                  })
                                  .catch(err => {
                                      console.log(err)
                                      next(err)
                                  })
                          })) 

      
                }
            }).catch((err) => {
                  console.log(err);
                  next(err)
            })
        }
    } catch (error) {
        console.log(error)
        next(err)
    }
});



const uploadSingleAdminImages = upload.single("img");

app.post("/edit-admin-image/:id", uploadSingleAdminImages, async(req, res, next) => {
    try {
        const id = req.params.id;
        Admin.findById(id).
                     then((admins) => {
                        admins.img = {
                            data: fs.readFileSync(
                                path.join( __dirname + "/uploads/" + req.file.filename)
                            ),
                            contentType: "image/png",
                          };
                admins.save()
                .then((value) => {
                    console.log (value);
                    req.flash("success_msg", "Images Uploaded");
                    return res.redirect('/admin/edit-admin?id=' + id)
                }).catch((err) => {
                    console.log (err);
                    res.json(err);
                    next(err);
                })
        }).catch((err) => {
         console.log(err);
         next(err);
        })
    } catch (error) {
        console.log (error)
    }
 } );
 
 const uploadMultipleAbout =  upload.single("img");
app.post('/create-info',ensureAuthenticated, uploadMultipleAbout, async(req, res, next) => {
  try {
      const {company_name, address, state,mobile,mobile2,mobile3,phone, email, heading, about} = req.body;
      const errors = [];
    
      if (!company_name || !heading || !about || !mobile || !email) {
          errors.push( { msg : "Please fill in all fields." } );
      }
  
      if(errors.length > 0){
          res.render('create_info', {
              errors: errors,
              company_name: company_name,
              address: address,
              mobile: mobile,
              mobile2: mobile2,
              mobile3: mobile3,
              phone: phone,
              email: email,
              linkedin: linkedin,
              facebook: facebook,
              instagram: instagram, 
              twitter: twitter, 
              whatsapp: whatsapp,
              state: state,
              heading: heading,
              about: about,
              user: req.user,
          } )
      }else{
          const newAbout = new About({
            company_name: company_name,
            address: address,
            state: state,
            mobile: mobile,
            mobile2: mobile2,
            mobile3: mobile3,
            phone: phone,
            email: email,
            linkedin: linkedin,
            facebook: facebook,
            instagram: instagram, 
            twitter: twitter, 
            whatsapp: whatsapp,
            heading: heading,
            about: about,
            img: img = {
              data: fs.readFileSync(
                  path.join( __dirname + "/uploads/" + req.file.filename)
              ),
              contentType: "image/png",
              },
          })

          newAbout
                .save()
                .then((value) => {
                  console.log(value)
                  req.flash("success_msg", "Data Registered !");
                  res.redirect("/admin/creating-info")
                })
                .catch((err) => console.log(err))
      }
  } catch (error) {
      console.log(error)
      next(error)
  }
});

const uploadSingleAdminAboutSingle = upload.single("img");

app.post("/edit-info-image/:id", uploadSingleAdminAboutSingle, async(req, res, next) => {
  try {
      const id = req.params.id;
      About.findById(id).
                   then((about) => {
                      about.img = {
                          data: fs.readFileSync(
                              path.join( __dirname + "/uploads/" + req.file.filename)
                          ),
                          contentType: "image/png",
                        };
              about.save()
              .then((value) => {
                  console.log (value);
                  req.flash("success_msg", "Images Uploaded");
                  return res.redirect('/admin/edit-info?id=' + id)

              }).catch((err) => {
                  console.log (err);
                  res.json(err);
                  next(err);
              })
      }).catch((err) => {
       console.log(err);
       next(err);
      })
  } catch (error) {
      console.log (error)
  }
} );


// Service
const uploadMultipleService =  upload.single("img");
app.post('/create-service',ensureAuthenticated, uploadMultipleService, async(req, res, next) => {
  try {
      const { heading, about} = req.body;
      const errors = [];
    
      if (!heading || !about ) {
          errors.push( { msg : "Please fill in all fields." } );
      };
  
      if(errors.length > 0){
          res.render('create_service', {
              errors: errors,
              heading: heading,
              about: about,
              user: req.user,
          } )
      } else {
          const newService = new Service({
            heading: heading,
            about: about,
            img: img = {
              data: fs.readFileSync(
                  path.join( __dirname + "/uploads/" + req.file.filename)
              ),
              contentType: "image/png",
              },
          })

          newService
                .save()
                .then((value) => {
                  console.log(value)
                  req.flash("success_msg", "Data Registered !");
                  res.redirect("/admin/creating-service")
                })
                .catch((err) => console.log(err))
      }
  } catch (error) {
      console.log(error)
      next(err)
  }
});

const uploadSingleAdminServiceSingle = upload.single("img");
app.post("/edit-service-image/:id", uploadSingleAdminServiceSingle, async(req, res, next) => {
  try {
      const id = req.params.id;
      Service.findById(id).
                   then((service) => {
                      service.img = {
                          data: fs.readFileSync(
                              path.join( __dirname + "/uploads/" + req.file.filename)
                          ),
                          contentType: "image/png",
                        };
              service.save()
              .then((value) => {
                  console.log (value);
                  req.flash("success_msg", "Images Uploaded");
                  return res.redirect('/admin/edit-service?id=' + id)
              }).catch((err) => {
                  console.log (err);
                  res.json(err);
                  next(err);
              })
      }).catch((err) => {
       console.log(err);
       next(err);
      })
  } catch (error) {
      console.log (error)
  }
} );


//creating staff
const uploadSingleStaffImage = upload.single("img");

app.post('/create-staff', ensureAuthenticated,
uploadSingleStaffImage, 
async (req, res,next) => {
  try {
   const {first_name, second_name, position, email, performance, phone, about,
    linkedin, facebook, instagram, twitter, whatsapp} = req.body;
   const errors = [];

   if (!first_name || !second_name || !position || !email || !performance || !about || !phone || !whatsapp) {
       errors.push( { msg : "Please fill in all the fields."})
   }
   if (errors.length > 0) {
       res.render('create_staff', {
           errors: errors,
           first_name: first_name,
           second_name: second_name,
           position: position,
           email : email,
           performance : performance,
           about:  about,
           phone: phone,
           linkedin: linkedin,
           facebook: facebook,
           instagram: instagram, 
           twitter: twitter, 
           whatsapp: whatsapp,
           user: req.user,
       })
   } else {
       Staff.findOne( { email: email } )
            .then((user) => {
           if(user) {
               errors.push( { msg: "The email provided already associated with an existing User" })
               res.render('create_staff', {
                errors: errors,
                first_name: first_name,
                second_name: second_name,
                position: position,
                email : email,
                performance : performance,
                about:  about,
                phone: phone,
                linkedin: linkedin,
                facebook: facebook,
                instagram: instagram, 
                twitter: twitter, 
                whatsapp: whatsapp,
                user: req.user,
               })
           }else if(!user){
               const newStaff = new Staff ({
                first_name: first_name,
                second_name: second_name,
                position: position,
                email : email,
                performance : performance,
                about:  about,
                phone: phone,
                linkedin: linkedin,
                facebook: facebook,
                instagram: instagram, 
                twitter: twitter, 
                whatsapp: whatsapp,
                   img : img = {
                    data: fs.readFileSync(
                        path.join( __dirname + "/uploads/" + req.file.filename)
                    ),
                    contentType: "image/png",
                    },
               }) 

               newStaff
                   .save()
                   .then((value) => {
                      
                        req.flash("success_msg", "Data Registered !");
                        res.redirect('/admin/create-staff');
                   }).catch((err) =>{
                     console.log (err)
                     next(err)
                    })
           }
       }).catch((err) => {
        console.log(err);
        next(err);
       })
   }

  } catch (error) {
       console.log (error);
       next(error);
  }
} )

// editting staffs image
const uploadSingleStaffImages = upload.single("img");
app.post("/edit-staff-image/:id", uploadSingleStaffImages, async(req, res, next) => {
    try {
        const id = req.params.id;
        Staff.findById(id).
                     then((staffs) => {
                        staffs.img = img = {
                            data: fs.readFileSync(
                                path.join( __dirname + "/uploads/" + req.file.filename)
                            ),
                            contentType: "image/png",
                          };
                staffs.save()
                .then((value) => {
                  req.flash("success_msg", "Images Uploaded");
                    return res.redirect('/admin/edit-staff?id=' + id)
                }).catch((err) => {
                    console.log (err);
                    res.json(err);
                    next(err);
                })
        }).catch((err) => {
         console.log(err);
         next(err);
        })
    } catch (error) {
        console.log (error)
    }
 } );


//creating LAnd property
  const uploadMultipleLand = upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'img2', maxCount: 1 },
  ]);
  
  app.post("/create-land",ensureAuthenticated, uploadMultipleLand, async (req, res) => {
    try {
      const {
        property_id,
        name,
        location,
        status,
        area,
        amenities,
        description,
        period
      } = req.body;
  
      //generate property code
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let voucherCode = '';
      for (let i = 0; i < 4; i++) {
        voucherCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      const codes = voucherCode;
  
      const errors = [];
  
      if (
        !name ||
        !location ||
        !status ||
        !area ||
        !amenities ||
        !description ||
        !period
      ) {
        errors.push({ msg: "Please fill in all fields." });
      }
      if (errors.length > 0) {
        res.render('create_land', {
          errors: errors,
          name: name,
          location: location,
          status: status,
          area: area,
          amenities: amenities,
          description: description,
          period: period,
          user: req.user,
        });
      } else {
           Land.findOne({ property_id : property_id})
            .then((prop) => {
                if(!prop) {
                    const property ={
                        property_id: voucherCode,
                        name: name,
                        location: location,
                        status: status,
                        area: area,
                        amenities: amenities.split(',').map(armenity => armenity.trim()),
                        description: description,
                        period: period,
                          img: {},
                          img2: {},
                      };
              
                      if (req.files['img']) {
                          property.img = {
                            data: fs.readFileSync(
                              path.join(__dirname + "/uploads/" + req.files['img'][0].filename)
                            ),
                            contentType: req.files['img'][0].mimetype,
                          };
                        }
                        if (req.files['img2']) {
                          property.img2 = {
                            data: fs.readFileSync(
                              path.join(__dirname + "/uploads/" + req.files['img2'][0].filename)
                            ),
                            contentType: req.files['img2'][0].mimetype,
                          };
                        }
                       
              
                      Land.create(property)
                                      .then((data) => {
                                          req.flash("success_msg", "Data Registered !");
                                          res.redirect('/admin/create-land');
                                      }).catch((err) => {
                                          console.log(err)
                                      })
                        
                }else {
                    if (prop) {
                        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let voucherCode = '';
                        for (let i = 0; i < 4; i++) {
                          voucherCode += characters.charAt(Math.floor(Math.random() * characters.length));
                        }
                        const codes = voucherCode;

                        const property ={
                            property_id: voucherCode,
                            name: name,
                            location: location,
                            status: status,
                            area: area,
                            amenities: amenities.split(',').map(armenity => armenity.trim()),
                            description: description,
                            period: period,
                              img: {},
                              img2: {},
                              floor_plan: {},
                              video: {},
                          };
                  
                          if (req.files['img']) {
                              property.img = {
                                data: fs.readFileSync(
                                  path.join(__dirname + "/uploads/" + req.files['img'][0].filename)
                                ),
                                contentType: req.files['img'][0].mimetype,
                              };
                            }
                            if (req.files['img2']) {
                              property.img2 = {
                                data: fs.readFileSync(
                                  path.join(__dirname + "/uploads/" + req.files['img2'][0].filename)
                                ),
                                contentType: req.files['img2'][0].mimetype,
                              };
                            }
                  
                          Land.create(property)
                                          .then((data) => {
                                             
                                              req.flash("success_msg", "Data Registered !");
                                              res.redirect('/admin/create-land');
                                          }).catch((err) => {
                                              console.log(err)
                                          })
                    }
                }
            })
        
      }
    } catch (error) {
      console.log(error);
    }
  });

  //updating Images
  const uploadMultipleLandImages = upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'img2', maxCount: 1 },
  ], function (err) {
    if (err) {
      console.log(err);
      // Handle the error here
    }
  });

//edit Property's images
app.post("/edit-land-image/:id", uploadMultipleLandImages, async (req, res) => {
  try {
    const propertyId = req.params.id;

    if (!propertyId) {
      throw new TypeError("Invalid property ID");
    }

    const property = {};

    if (req.files['img']) {
        property.img = {
          data: fs.readFileSync(
            path.join(__dirname + "/uploads/" + req.files['img'][0].filename)
          ),
          contentType: req.files['img'][0].mimetype,
        };
      }
      if (req.files['img2']) {
        property.img2 = {
          data: fs.readFileSync(
            path.join(__dirname + "/uploads/" + req.files['img2'][0].filename)
          ),
          contentType: req.files['img2'][0].mimetype,
        };
      }

    const filter = { _id: propertyId };
    const update = { $set: property };
    const options = { returnOriginal: false };

    const result = await Land.findOneAndUpdate(filter, update, options);

    if (!result) {
      return res.status(404).json({ error: "Property not found" });
    }
    req.flash("success_msg", "Images Uploaded");
    return res.redirect('/admin/edit-land?id=' + propertyId);
  } catch (error) {
    if (error.name === "CastError" || error.name === "TypeError") {
      return res.status(400).json({ error: error.message });
    }
    console.log(error);
    return res.status(500).send();
  }
});


//testimony
const uploadMultipletesty =  upload.single("img");
app.post('/create-testimony', uploadMultipletesty, async(req, res, next) => {
  try {
      const { full_name, testimony} = req.body;
      const errors = [];
    
      if (!full_name || !testimony ) {
          errors.push( { msg : "Please fill in all fields." } );
      };
  
      if(errors.length > 0){
          res.render('create_feedback', {
              errors: errors,
              full_name: full_name,
              testimony: testimony,
          } )
      } else {
          const newTestimony = new Testimony({
            full_name: full_name,
            testimony: testimony,
            img: img = {
              data: fs.readFileSync(
                  path.join( __dirname + "/uploads/" + req.file.filename)
              ),
              contentType: "image/png",
              },
          })

          newTestimony
                .save()
                .then((value) => {
                  console.log(value)
                  req.flash("success_msg", "Testimony sent Successfully!, thank you for doing business with us.");
                  res.redirect("/feedback")
                })
                .catch((err) => console.log(err))
      }
  } catch (error) {
      console.log(error)
      next(error)
  }
});



//replying to contact 

const contactAttachmentUpload = multer({ dest: 'uploads/' });

app.post('/send-single-email', contactAttachmentUpload.single('attachment'), async (req, res) => {
  const { subject, message, email } = req.body;
  const id = req.query.id;
  try {
   
    const html = `
    <html>
      <head>
        <style>
          /* Define your CSS styles here */
          body {
            font-family: Arial, sans-serif;
            font-size: 16px;
            color: #333;
          }
          h1 {
            color: #ff0000;
          }
          p {
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
      <img src="/assets/img/Valiant-01.png" alt="Company Logo">
        <h1>${req.body.subject}</h1>
        <p>${req.body.message}</p>
      </body>
    </html>
  `;
    
    const mailOptions = {
      from: 'Valiantfoot@gmail.com',
      to: req.body.email,
      subject: req.body.subject,
      html: html,
      attachments: [{
        filename: req.file.originalname,
        path: req.file.path,
      }],
    };

    
    const smtpConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      auth: {
        user: 'Valiantfoot@gmail.com',
        pass: PASSWORD_EMAIL
      },
      pool: true, // Enable the use of a pooled connection
      maxConnections: 5, // Limit the number of simultaneous connections
      maxMessages: 100, // Limit the number of messages per connection
      rateDelta: 1000, // Increase the delay between messages if rate limit is exceeded
      rateLimit: 1000, // Maximum number of messages that can be sent per minute
    };
    const transporter = nodemailer.createTransport(smtpPool(smtpConfig));
    await transporter.sendMail(mailOptions);
    req.flash('success_msg', 'Email sent');
  } catch (err) {
    console.log(err);
    req.flash('error', 'Could not send email');
  }
  res.redirect('/admin/replying?id=' + id);
});


//subscriber
const contactAttachmentUploads = multer({ dest: 'uploads/' });
app.post('/send-email', contactAttachmentUploads.single('attachment'), async (req, res) => {
  const { subject, message } = req.body;
  try {
    const html = `
    <html>
      <head>
        <style>
          /* Define your CSS styles here */
          body {
            font-family: Arial, sans-serif;
            font-size: 16px;
            color: #333;
          }
          h1 {
            color: #b25400;
          }
          p {
            line-height: 1.5;
            white-space: pre-line;
          }
        </style>
      </head>
      <body>
      <img src="/img/Valiant-01.png" alt="Company Logo">
        <h1>${req.body.subject}</h1>
        <p>${req.body.message}</p>
      </body>
    </html>
  `;

    const subscribers = await Subscriber.find({});
    const recipientEmails = subscribers.map(subscriber => subscriber.email);

    const mailOptions = {
      from: 'Valiantfoot@gmail.com',
      to: recipientEmails,
      subject: req.body.subject,
      html: html,
      attachments: [{
        filename: req.file.originalname,
        path: req.file.path,
      }],
    };

    const smtpConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      auth: {
        user: 'Valiantfoot@gmail.com',
        pass: PASSWORD_EMAIL
      },
      pool: true, // Enable the use of a pooled connection
      maxConnections: 5, // Limit the number of simultaneous connections
      maxMessages: 100, // Limit the number of messages per connection
      rateDelta: 1000, // Increase the delay between messages if rate limit is exceeded
      rateLimit: 1000, // Maximum number of messages that can be sent per minute
    };

    const transporters = nodemailer.createTransport(smtpPool(smtpConfig));
    await transporters.sendMail(mailOptions);
    req.flash('success_msg', 'Email sent');
  } catch (err) {
    console.log(err);
    req.flash('error', 'Could not send email');
  }
  res.redirect('/admin/email_subscriber');
});


const server = app.listen(PORT, () => {
    let host = server.address().address;
    let port = server.address().port;
    console.log(`server running and listening at http:/%s, %%s, ${host}, ${port}`);
})
  

