import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // Existing Todo model
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.guest()]),

  // Users table
  User: a
    .model({
      userId: a.id().required(),
      userType: a.string().default('anonymous'),
      username: a.string().required(),
      email: a.string(),
      createdAt: a.datetime(),
      lastActive: a.datetime(),
      gamesPlayed: a.integer().default(0),
      gamesWon: a.integer().default(0),
      preferredGameTypes: a.string().array(),
      userPreferences: a.json(),
    })
    .identifier(['userId'])
    .authorization((allow) => [
      allow.owner().to(['read', 'update']),
      allow.authenticated().to(['read']),
      allow.guest().to(['read'])
    ]),

  // Game History table
  GameHistory: a
    .model({
      gameId: a.id().required(),
      userId: a.id().required(),
      gameType: a.string().required(),
      playerCount: a.integer(),
      finalRank: a.integer(),
      isWinner: a.boolean().default(false),
      completedAt: a.datetime(),
      durationMinutes: a.integer(),
      gameData: a.json(),
    })
    .identifier(['gameId', 'userId'])
    .authorization((allow) => [
      allow.owner().to(['read', 'create']),
      allow.authenticated().to(['read']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>

