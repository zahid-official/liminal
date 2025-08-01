require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// middleware
app.use(
  cors({
    // set origin of production site
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://liminal-official.vercel.app",
    ],
    credentials: true,
  })
);
app.options("*", cors());
app.use(express.json());
app.use(cookieParser());

// custom middleware
const verifyJWT = (req, res, next) => {
  const token = req.headers?.authorization;

  if (!token) {
    return res.status(401).send({ message: "Unauthorize Access" });
  }

  // verify frontend token & backend token both
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Unauthorize Access" });
    }
    // creating a new property in req object
    req.decoded = decoded;
    next();
  });
};

// MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.rjxsn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // database
    const database = client.db("liminalDB");
    const usersCollection = database.collection("usersCollection");
    const projectsCollection = database.collection("projectsCollection");

    // custom middleware for verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email };
      const userData = await usersCollection.findOne(query);
      const admin = userData?.role === "admin";
      if (!admin) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    // jwt token generate
    {
      app.post("/jwt", (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        res.send({ token });
      });

      // verify user role
      app.get("/userRole/:email", verifyJWT, async (req, res) => {
        const email = req.params.email;
        const decodedMail = req.decoded.email;

        // verify JWT email & param email
        if (decodedMail !== email) {
          return res.status(403).send({ message: "Forbidden Access" });
        }

        const query = { email };
        const userData = await usersCollection.findOne(query);

        let admin = false;
        if (userData?.role === "admin") {
          admin = true;
        }

        res.send({ admin });
      });
    }

    // cloudinary
    {
      const generatePublicId = (buffer) => {
        const crypto = require("crypto");
        return crypto.createHash("md5").update(buffer).digest("hex");
      };

      // bannerImage upload API
      app.post(
        "/uploadBannerImage",
        upload.single("bannerImage"),
        async (req, res) => {
          try {
            const bannerFile = req.file;

            if (!bannerFile) {
              return res.status(400).json({ error: "Banner Image required" });
            }

            const bannerPublicId = generatePublicId(bannerFile.buffer);
            const bannerURL = await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder: "projects/banner",
                  public_id: bannerPublicId,
                  overwrite: true,
                  unique_filename: false,
                },
                (error, result) => {
                  if (error) return reject(error);
                  resolve(result.secure_url);
                }
              );
              stream.end(bannerFile.buffer);
            });

            res.json({ bannerURL });
          } catch (error) {
            console.error("Banner Upload Error:", error);
            res.status(500).json({ error: "Banner upload failed" });
          }
        }
      );

      // additionalImages upload API
      app.post(
        "/uploadAdditionalImages",
        upload.array("additionalImages", 10),
        async (req, res) => {
          try {
            const additionalFiles = req.files;

            if (!additionalFiles || additionalFiles.length === 0) {
              return res
                .status(400)
                .json({ error: "Additional Images required" });
            }

            const additionalURLs = await Promise.all(
              additionalFiles.map((file) => {
                const filePublicId = generatePublicId(file.buffer);
                return new Promise((resolve, reject) => {
                  const stream = cloudinary.uploader.upload_stream(
                    {
                      folder: "projects/additional",
                      public_id: filePublicId,
                      overwrite: true,
                      unique_filename: false,
                    },
                    (error, result) => {
                      if (error) return reject(error);
                      resolve(result.secure_url);
                    }
                  );
                  stream.end(file.buffer);
                });
              })
            );

            res.json({ additionalURLs });
          } catch (error) {
            console.error("Additional Upload Error:", error);
            res.status(500).json({ error: "Additional image upload failed" });
          }
        }
      );
    }

    // read Operation
    {
      app.get("/", (req, res) => {
        res.send("Server Connected Successfully");
      });

      // get all projects for users
      app.get("/projects", async (req, res) => {
        const result = await projectsCollection.find().toArray();
        res.send(result);
      });

      // get single project details
      app.get("/projectDetails/:id", async (req, res) => {
        const paramas = req.params.id;
        const query = { _id: new ObjectId(paramas) };
        const result = await projectsCollection.findOne(query);
        res.send(result);
      });

      // get all projects for admin manageProjects
      app.get("/manageProjects", verifyJWT, verifyAdmin, async (req, res) => {
        const result = await projectsCollection.find().toArray();
        res.send(result);
      });

      // get all users for admin manageUsers
      app.get("/manageUsers", verifyJWT, verifyAdmin, async (req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result);
      });

      // get all upcomingProjects
      app.get("/upcomingProjects", async (req, res) => {
        const query = { status: "Ongoing" };
        const result = await projectsCollection
          .find(query)
          .sort({ _id: -1 })
          .limit(5)
          .toArray();
        res.send(result);
      });

      // get all latestProjects
      app.get("/latestProjects", async (req, res) => {
        const result = await projectsCollection
          .find()
          .sort({ _id: -1 })
          .limit(5)
          .toArray();
        res.send(result);
      });
    }

    // create Operation
    {
      // add user in DB
      app.post("/users", async (req, res) => {
        const user = req.body;
        const query = { email: user?.email };
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: "User Already Exist", insertedId: null });
        }

        const result = await usersCollection.insertOne(user);
        res.send(result);
      });

      // add project
      app.post("/addProject", verifyJWT, verifyAdmin, async (req, res) => {
        const projectData = req.body;
        const result = await projectsCollection.insertOne(projectData);
        res.send(result);
      });
    }

    // update Operation
    {
      app.patch(
        "/updateProject/:id",
        verifyJWT,
        verifyAdmin,
        async (req, res) => {
          const id = req.params.id;
          const data = req.body;
          const query = { _id: new ObjectId(id) };

          const updatedData = {
            $set: {
              title: data?.title,
              category: data?.category,
              status: data?.status,
              description: data?.description,
              bannerImage: data?.bannerImage,
              additionalImages: data?.additionalImages,
            },
          };

          const result = await projectsCollection.updateOne(query, updatedData);
          res.send(result);
        }
      );

      // update user role
      app.patch(
        "/updateUserRole/:id",
        verifyJWT,
        verifyAdmin,
        async (req, res) => {
          const id = req.params.id;
          const role = req.body?.role;
          const query = { _id: new ObjectId(id) };
          const updatedData = {
            $set: { role },
          };

          const result = await usersCollection.updateOne(query, updatedData);
          res.send(result);
        }
      );
    }

    // delete Operation
    {
      app.delete(
        "/deleteProject/:id",
        verifyJWT,
        verifyAdmin,
        async (req, res) => {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const result = await projectsCollection.deleteOne(query);
          res.send(result);
        }
      );

      // delete user from manageUsers
      app.delete(
        "/deleteUser/:id",
        verifyJWT,
        verifyAdmin,
        async (req, res) => {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const result = await usersCollection.deleteOne(query);
          res.send(result);
        }
      );
    }
  } finally {
  }
}
run().catch(console.log);

// port running on
app.listen(port, () => {
  console.log(`Server Running on... : ${port}`);
});
