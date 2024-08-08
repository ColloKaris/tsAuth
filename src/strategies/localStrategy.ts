import passport from 'passport';
import bcrypt from 'bcrypt';
import * as mongodb from 'mongodb';
import { Strategy } from 'passport-local'; // All strategies have this
// Strategy class
import { collections } from '../models/database.js';

// Create an instance of our local strategy
export const localStrategy = new Strategy(async (username, password, done) => {
  try {
    // Check if the actual user exists.
    const user = await collections.users?.findOne({ username: username });
    if (!user) throw new Error("INCORRECT USERNAME OR PASSWORD");

    // Check if the username and passwords match.
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new Error("INCORRECT USERNAME OR PASSWORD ");
    done(null, user);
  } catch (err) {
    return done(err); // can have another argument null, false
  }
});

passport.serializeUser((user, done) => {
  console.log('Inside Serialize User');
  console.log(user);
  done(null, user._id);
})

passport.deserializeUser(async (id: mongodb.ObjectId, done) => {
  try {
    console.log('Inside Deserialize User');
    
    const user = await collections.users?.findOne({_id: new mongodb.ObjectId(id)});
    console.log(`Deserializing User ID: ${id}`)
    console.log(user);
    if (!user) throw new Error("User Not Found!");
    done(null, user)
  } catch (err) {
    done(err, null)
  }
})
