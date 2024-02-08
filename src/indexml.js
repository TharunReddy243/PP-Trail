const express = require("express");
const mongoose = require('mongoose');
//const app = express();
// const bodyParser = require('body-parser');
// const path = require("path");
const session = require('express-session');
// const MongoStore = require("connect-mongo")(session);
const MongoStore = require('connect-mongo');
// const MongoStore = require('connect-mongo')(session);
const app = express();
const bodyParser = require('body-parser');
const path = require("path");
const bcrypt = require("bcrypt");
// const mongoose = require('mongoose');
const collection2 = require("./mongodb");
const formDataArray = [];
const { exec } = require('child_process');
const collection3 = require("./mongodb");
const pythonScriptPath = 'predict_model.py';

let userId;
let pythonOp;
let date;


const templatePath = path.join(__dirname, "../templates");
const publicPath = path.join(__dirname, '../templates');

const mongoStore = new MongoStore({
    mongooseConnection: mongoose.connection,
    mongoUrl:  "mongodb://localhost:27017/unamepwd"
    // Add your MongoDB connection details here if not using the default connection.
    // Example: mongoUrl: 'mongodb://username:password@localhost:27017/yourdatabase',
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    // store: new MongoStore({ mongooseConnection: mongoose.connection }),
    store: mongoStore,
}));
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.static(publicPath));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let loginError = false;
let signupError = false;
let riskPercentage;

app.get("/", (req, res) => {
    res.render("homepage");
});

app.get("/signup", (req, res) => {
    res.render("login", { loginError, signupError });
});

app.post("/signup", async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.signuppassword, 10);
    const data = {
        name: req.body.signupname,
        password: hashedPassword,
    };
    const checking = await collection2.findOne({ name: req.body.signupname });

    if (req.body.signuppassword === req.body.passwordcheck) {
        if (checking) {
            signupError = true;
            const signupErrorMessage = "User details already exist, so please sign in.";
            return res.render('login', { signupErrorMessage, hideSignupButton: true, loginError, signupError });
        } else {
            try {
                const user = await collection3.insertMany([data]);
                // const user = await collection3.create(data);  // Corrected: Use collection3.create to create a new user
                // const user = new collection3(data);
                // await user.save();
                req.session.userId = user._id;
                const success = "Account has been created. So Please Sign-In"
                res.render("login", { success });
            } catch (error) {
                signupError = true;
                const signupErrorMessage = "Error during user signup.";
                return res.render('login', { signupErrorMessage, loginError, signupError });
            }
        }
    } else {
        signupError = true;
        const signupErrorMessage = "Re-check the passwords";
        return res.render('login', { signupErrorMessage, loginError, signupError });
    }
});

app.post("/login", async (req, res) => {
    try {
        const check = await collection3.findOne({ name: req.body.loginname });
        if (check && (await bcrypt.compare(req.body.loginpassword, check.password))) {
            loginError = false;
            signupError = false;
            // req.session.userId = check._id;
            // const user_id = req.session.userId;
            // userid=user_id;
            // req.session.userId = user._id;
            req.session.userId = check._id;
            console.log(req.session.userId);
            // console.log(userId);
            //return res.redirect(`/profile/${check._id}`);
            return res.redirect('/profile');
        } else {
            loginError = true;
            const loginErrorMessage = "Sorry, your password was incorrect. Please double-check your password.";
            res.render('login', { loginErrorMessage, loginError, signupError });
        }
    } catch {
        loginError = true;
        const loginErrorMessage = "Create a new account before Sign - In";
        res.render('login', { loginErrorMessage, loginError, signupError });
    }
});



app.get("/details", (req, res) => {
    res.render('details');
});

app.post('/submit', async (req, res) => {
    try {
        const userId = req.session.userId;

        if (userId) {
            const existingUser = await collection3.findById(userId).exec();

            if (existingUser.details && existingUser.details.length === 0) {
                const details = 
                    {
                        fullname: req.body.fullname,
                        age: parseInt(req.body.age),
                        height: parseInt(req.body.height),
                        weight: parseInt(req.body.weight),
                        gender: req.body.gender,
                        bloodgroup: req.body.bloodgroup,
                        imagePath: getProfileImage(req.body.gender),
                    };
                
                existingUser.details.push(details);

                await existingUser.save();
                // await user.save();
                // Save user ID in session
                // req.session.userId = user._id;

                res.redirect('/profile');

                // await collection3.findByIdAndUpdate(user_id, { $set: { details: details } });
                // res.redirect(`/profile/${user_id}`);
            } else {
                console.log('Details already exist for the user');
                res.status(400).send('Details already exist for the user');
            }
        } else {
            console.log('User not logged in');
            res.status(401).send('Unauthorized');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
function getProfileImage(gender) {
    if (gender === 'Male') {
        return 'male.png';
    } if (gender === 'Female') {
        return 'female.png';
    } if (gender === 'Others') {
        return 'others.png';
    }
};

//app.get('/profile/:check_id', async (req, res) => {
    app.get('/profile', async (req, res) => {


    try {
        //const userId = req.params.check_id;
        const userId = req.session.userId;
        
        if (userId) {
            const user = await collection3.findById(userId).exec();
            if(user){
            if (user.details && user.details.length === 0) {
                res.render('details', { user });
            } else {
                // const image = getImageByGender(user.gender);
                // console.log('Selected Image:', user.imagepath);
                res.render('profile', { user });
            }
        } else {
            console.log('Invalid user ID');
            res.status(400).send('Invalid user ID');
        } 
    }else {
            // If userId is not available in the session, send an unauthorized response
            console.log('User not logged in');
            res.status(401).send('Unauthorized');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error ');
    }
});


app.get("/question", (req, res) => {
    res.render('questions')
});

app.post('/formsubmitted', async (req, res) => {
    try {
        console.log(user_id);
        const userId = req.session.userId;

        if (!userId) {
            console.log('User not logged in');
            return res.status(401).send('Unauthorized');
        }

        const userDetails = {
            HighBP: parseFloat(req.body.HighBP),
            HighChol: parseFloat(req.body.HighChol),
            CholCheck: parseFloat(req.body.CholCheck),
            BMI: parseFloat(req.body.BMI),
            Smoker: parseFloat(req.body.Smoker),
            Stroke: parseFloat(req.body.Stroke),
            Diabetes: parseFloat(req.body.Diabetes),
            PhysActivity: parseFloat(req.body.PhysActivity),
            Fruits: parseFloat(req.body.Fruits),
            Veggies: parseFloat(req.body.Veggies),
            HvyAlcoholConsump: parseFloat(req.body.HvyAlcoholConsump),
            GenHlth: parseFloat(req.body.GenHlth),
            MentHlth: parseFloat(req.body.MentHlth),
            PhysHlth: parseFloat(req.body.PhysHlth),
            DiffWalk: parseFloat(req.body.DiffWalk),
            Sex: parseFloat(req.body.Sex),
            Age: parseFloat(req.body.Age),
            pythonOutput: '',
        };

        const formDataString = Object.values(userDetails).join(' ');
        const executeCommand = `cd "C:\\Users\\CHARITHA BODIGE\\Desktop\\ML" && python ${pythonScriptPath} ${formDataString}`;

        const date = new Date();
        const newFormEntry = {
            date: date,
            formValues: userDetails,
        };

        // Execute Python code
        exec(executeCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return res.status(500).send('Internal Server Error');
            }

            const pythonOutput = stdout.trim();
            pythonOp = pythonOutput;
            newFormEntry.formValues.pythonOutput = pythonOutput;

            collection3
                .findByIdAndUpdate(user_id, { $push: { formHistory: newFormEntry } }, { new: true })
                .then(updatedUser => {
                    if (!updatedUser) {
                        console.log('User not found');
                        return res.status(404).send('User not found');
                    }

                    console.log('Form entry and Python output updated successfully');
                    console.log(pythonOutput);
                    res.render('result', { pythonOutput });
                    riskPercentage = Math.round(pythonOutput);
                    // res.status(200).send('Form submitted successfully');
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).send('Internal Server Error');
                });
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/sugg', (req, res) => {
    getRiskSuggestions(riskPercentage);
    function getRiskSuggestions(riskPercentage) {
        if (riskPercentage < 25) {
            res.render('sugg1', { riskPercentage })
        } else if (riskPercentage < 50) {
            res.render('sugg2', { riskPercentage })
        } else if (riskPercentage < 75) {
            res.render('sugg3', { riskPercentage })
        } else {
            res.render('sugg4', { riskPercentage })
        }
    }
});

app.get('/viewFormData', (req, res) => {
    res.json(formDataArray);
});

app.listen(3001, () => {
    console.log("port connected");
});