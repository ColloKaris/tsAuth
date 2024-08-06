import { SessionData } from 'express-session';
import * as mongodb from 'mongodb';

declare module 'express-session' {
  interface SessionData {
    user_id: mongodb.ObjectId;
  }
}