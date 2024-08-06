import express, { Request, Response, NextFunction} from 'express';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import path from 'path'
import { connectToDatabase, collections } from './models/database.js';
import bcrypt from 'bcrypt';
import session from 'express-session'

dotenv.config();
const { ATLAS_URI } = process.env;

if (!ATLAS_URI) { // Check if ATLAS_URI is defined, otherwise exit app.
  console.log("ATLAS_URI is not defined!");
  process.exit(1);
}

const app = express();

// Use import.meta.url to get the current module's URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'))

app.use(express.urlencoded({extended: true})); // parse request body
app.use(session({secret:'notagoodsecret', resave: false, saveUninitialized: false}))

// Routing logic.
app.get('/', (req: Request, res: Response) => {
  res.send('THIS IS THE HOME PAGE')
})

app.get('/register', (req: Request, res: Response) => {
  res.render('pages/register')
})

// Register new user
app.post('/register', async (req: Request, res: Response) => {
  const user = req.body;
  const hash = await bcrypt.hash(req.body.password, 12);
  user.password = hash;

  const result = await collections.users?.insertOne(user);
  if(result?.acknowledged) {
    console.log("Successfully created a new user");
    req.session.user_id = user._id;
    res.redirect('/secret')
  } else {
    console.log("Failed to create a new user");
  }
})

// Login a registered user
app.get('/login', (req: Request, res: Response) => {
  res.render('pages/login');
});

app.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await collections.users?.findOne({username: username});
  if(user) {
    const validPassword = await bcrypt.compare(password, user.password);
    if(validPassword) {
      req.session.user_id = user._id; // use this because often we want to lookup the use who is logged in
      res.redirect('/secret')
    } else {
      res.send("INCORRECT USERNAME OR PASSWORD");
    }
  } else {
    res.send("INCORRECT USERNAME OR PASSWORD")
  }
})

// logout
app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err: any) => {
    if (err) {
      console.log("Failed to destroy the session during logout", err);
      res.status(500).send('Logout failed');
    } else {
      res.redirect('/login')
    }
  }) 
  
})

app.get('/secret', (req: Request, res: Response) => {
  if (!req.session.user_id) {
    return res.redirect('/login') // return since we are not using if...else
  }
  res.render('pages/secret');
  //res.send("THIS IS SECRET! YOU CANNOT SEE ME UNLESS YOU ARE LOGGED IN")
})

// End of Routing logic.
connectToDatabase(ATLAS_URI)
  .then(() => {
    console.log('Database Connected');

    app.listen(3000, () => {
      console.log('SERVER LISTENING ON PORT 3000');
    })
  })
  .catch((error) => console.log(error));