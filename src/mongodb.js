const mongoose = require("mongoose");

async function connectToMongoDB() {
  try {
    //wait mongoose.connect("mongodb+srv://Charita:Charita077@cluster0.i1yqegl.mongodb.net/?retryWrites=true&w=majority", {

        await mongoose.connect("mongodb://localhost:27017/unamepwd", {
      // await mongoose.connect("mongodb+srv://Akash:Akash088@cluster0.i1yqegl.mongodb.net/?retryWrites=true&w=majority",{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    throw error; // Rethrow the error to handle it at the higher level
  }
}

connectToMongoDB();
const LogInSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  details: [
    {
      fullname:
      {
        type: String,
        required: true,
      },
      age: {
        type: Number,
        required: true,
      },
      height: {
        type: Number,
        required: true,
      },
      weight: {
        type: Number,
        required: true,
      },
      gender: {
        type: String,
        // enum: ['Male', 'Female', 'Others'],
        required: true
    },
      bloodgroup: {
        type: String,
        required: true,
      },
      imagePath: {
        type: String,
        // default: 'others.png', // Default image for other genders or if gender is not specified
      },
    },
    
  ],
  formHistory: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      formValues: {
        HighBP: Number,
        HighChol: Number,
        CholCheck: Number,
        BMI: Number,
        Smoker: Number,
        Stroke: Number,
        Diabetes: Number,
        PhysActivity: Number,
        Fruits: Number,
        Veggies: Number,
        HvyAlcoholConsump: Number,
        GenHlth: Number,
        MentHlth: Number,
        PhysHlth: Number,
        DiffWalk: Number,
        Sex: Number,
        Age: Number,
        // Add any other fields you need
      },
    },
  ],
});

const collection3 = mongoose.model("collection4", LogInSchema);

module.exports = collection3;