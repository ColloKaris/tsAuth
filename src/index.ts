import express, { Request, Response, NextFunction} from 'express';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import path from 'path'
import { connectToDatabase } from './models/database.js';
import ejs from 'ejs'

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

// Routing logic.
app.get('/register', (req: Request, res: Response) => {
  res.render('pages/register')
})

app.post('/register', async (req: Request, res: Response) => {
  res.send(req.body)
})

app.get('/secret', (req: Request, res: Response) => {
  res.send("THIS IS SECRET! YOU CANNOT SEE ME UNLESS YOU ARE LOGGED IN")
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


