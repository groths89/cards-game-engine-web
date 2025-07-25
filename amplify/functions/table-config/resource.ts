import { defineFunction } from '@aws-amplify/backend';

export const tableConfig = defineFunction({
  name: 'table-config',
  entry: './handler.ts',
});