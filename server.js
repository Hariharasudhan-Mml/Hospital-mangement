const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMoongose = require("passport-local-mongoose");
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static("public"));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DB_url).then(() => {
  console.log(`DB is connected `);
});

const adminSchema = mongoose.Schema({
  email: String,
  password: String,
});

const patientSchema = mongoose.Schema({
  patient_id: Number,
  patient_name: String,
  patient_age: Number,
  patient_address: String,
  patient_mobileNo: Number,
  patient_disease: String,
});
adminSchema.plugin(passportLocalMoongose);

const Admin = mongoose.model("admins", adminSchema);
const Patient = mongoose.model("patients", patientSchema);

passport.use(Admin.createStrategy());
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

app.get("/", (req, res) => {
  res.render("login", {
    type: "user",
  });
});

app.post("/", (req, res) => {
  // Admin.register({ username: req.body.username }, req.body.password)
  //   .then((user) => {
  //     passport.authenticate("local")(req, res, () => {
  //       res.send("Authenticated");
  //     });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     res.send(err)
  //   });
  const user = new Admin({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
      res.send("Your are Login  Attempt Failed");
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/admin");
      });
    }
  });
});
app.get("/logout", (req, res) => {
  if (req.isAuthenticated()) {
    req.logout();
    res.redirect("/");
  } else {
    res.redirect("/");
  }
});
app.get("/admin", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("admin");
  } else {
    res.redirect("/");
  }
});

app.get("/add", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("add");
  } else {
    res.redirect("/");
  }
});

app.post("/add", (req, res) => {
  if (req.isAuthenticated()) {
    const patient = new Patient({
      patient_id: req.body.patient_id,
      patient_name: req.body.patient_name,
      patient_age: req.body.patient_age,
      patient_address: req.body.patient_address,
      patient_mobileNo: req.body.patient_mobileNo,
      patient_disease: req.body.patient_disease,
    });
    patient.save().then(() => {
      res.render("success", {
        type: "Added",
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/patients", (req, res) => {
  if (req.isAuthenticated()) {
    Patient.find({}).sort({patient_id:1}).then((users) => {
      if (users) {
        res.render("list", {
          users: users,
        });
      } else {
        res.render("failure", {
          message: "No users Found",
        });
      }
    });
  } else {
    res.redirect("/");
  }
});
app.get("/update", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("search", {
      button: "Search",
      path: "data",
    });
  } else {
    res.redirect("/");
  }
});

app.post("/data", (req, res) => {
  if (req.isAuthenticated()) {
    Patient.findOne({ patient_id: req.body.id }).then((user) => {
      if (user) {
        res.render("data", {
          user: user,
          path: "updated",
        });
      } else {
        res.render("failure", {
          message: "user not found",
        });
      }
    });
  }
});

app.post("/updated", (req, res) => {
  if (req.isAuthenticated()) {
    Patient.findOneAndUpdate(
      { patient_id: req.body.patient_id },
      req.body,
      (err, user) => {
        if (err) {
          res.render("failure", {
            message:
              "There was an Problem with Updating Patient's Info ,Try again after some time ",
          });
        } else {
          res.render("success", {
            type: "Updated",
          });
        }
      }
    );
  } else {
    res.redirect("/");
  }
});

app.get("/delete", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("search", {
      button: "Delete",
      path: "delete",
    });
  } else {
    res.redirect("/");
  }
});

app.post("/delete", (req, res) => {
  Patient.findOneAndDelete({ patient_id: req.body.id }, (err, user) => {
    if (user) {
      res.render("success", {
        type: "Deleted",
      });
    } else {
      res.render("failure", {
        message: "No patient found with this Id",
      });
    }
  });
});
const port = process.env.PORT || "5000";
app.listen(port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log("Server is Up and Running");
});
