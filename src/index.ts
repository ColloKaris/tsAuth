import express, { Request, Response, NextFunction} from 'express';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import path from 'path'
import { connectToDatabase, collections } from './models/database.js';
import bcrypt from 'bcrypt';
import session from 'express-session'
import passport from 'passport';
import { localStrategy } from './strategies/localStrategy.js';

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

// Authentication using passport.
app.use(passport.initialize());
app.use(passport.session());
passport.use(localStrategy);

// Authentication middleware.
const requireLogin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.passport?.user) {
    return res.redirect('/login')
  }
  next();
}

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
    req.session.passport = {user: user._id};
    res.redirect('/secret')
  } else {
    console.log("Failed to create a new user");
  }
})

// Login a registered user
app.get('/login', (req: Request, res: Response) => {
  res.render('pages/login');
});

app.post('/login', passport.authenticate('local'), async (req: Request, res: Response) => {
  res.redirect('/secret');
  //console.log(req.session.passport.user);
  //console.log(req.session)
  
  // const { username, password } = req.body;
  // const user = await collections.users?.findOne({username: username});
  // if(user) {
  //   const validPassword = await bcrypt.compare(password, user.password);
  //   if(validPassword) {
  //     req.session.user_id = user._id; // use this because often we want to lookup the use who is logged in
  //     res.redirect('/secret')
  //   } else {
  //     res.send("INCORRECT USERNAME OR PASSWORD");
  //   }
  // } else {
  //   res.send("INCORRECT USERNAME OR PASSWORD")
  // }
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

app.get('/secret', requireLogin, (req: Request, res: Response) => {
  res.render('pages/secret');
});

app.get('/topsecret', requireLogin, (req: Request, res: Response, next: NextFunction) => {
  res.send("TOP SECRET PAGE");
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