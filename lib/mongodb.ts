import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI in environment variables");
}

const options = {};

declare global {
  // eslint-disable-next-line no-var
  var _mongodbClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongodbClientPromise) {
    client = new MongoClient(uri, options);
    global._mongodbClientPromise = client.connect();
  }
  clientPromise = global._mongodbClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb() {
  const connectedClient = await clientPromise;
  const dbName = process.env.MONGODB_DB_NAME ?? "vardaan";
  return connectedClient.db(dbName);
}
