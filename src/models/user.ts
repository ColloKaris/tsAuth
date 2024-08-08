import * as mongodb from 'mongodb';

export interface User {
  _id: mongodb.ObjectId,
  username: string,
  password: string
}