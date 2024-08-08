import * as mongodb from 'mongodb';

declare global {
  namespace Express {
    interface User {
      _id: mongodb.ObjectId;
      username: string;
      password: string;
    }
  }
}
