import * as mongodb from 'mongodb';
import { User } from './user.js';

// Object to hold all collections.
export const collections: {
  users?: mongodb.Collection<User>
} = {};

// Function for connecting to the Database.
export async function connectToDatabase(uri: string) {
  const client = new mongodb.MongoClient(uri);
  await client.connect();

  // Create DB instance.
  const db = client.db('authDemo');
  await applySchemaValidation(db);

  // set collections.users to point to the users collection
  collections.users = db.collection<User>('users');
  return client;
}

// Schema validation for the User collection.
async function applySchemaValidation(db: mongodb.Db) {
  const userSchema = {
    $jsonSchema: {
      bsonType: "object",
      required: ['username', 'password'],
      properties: {
        _id:{},
        username: {
          bsonType: 'string',
          description: 'A username to identify a user'
        },
        password: {
          bsonType: 'string',
          description: 'Hashed version of the user password'
        }
      }
    }
  }

  // Try modify the User collection or explicitly create it if it doesn't exist
  await db.command({collMod: 'users', validator: userSchema})
    .catch(async (error: mongodb.MongoServerError) => {
      if (error.codename === 'NamespaceNotFound') {
        await db.createCollection('users', {validator: userSchema})
      }
    })
}