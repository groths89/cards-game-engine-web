import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
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
      allow.owner('userPools').to(['read', 'update']),
      allow.authenticated('userPools').to(['read']),
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
      allow.owner('userPools').to(['read', 'create']),
      allow.authenticated('userPools').to(['read']),
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
