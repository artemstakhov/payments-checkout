import { paymentMethods } from './data';

export const resolvers = {
  Query: {
    paymentMethods: (_parent: unknown, args: { currency: string }) =>
      paymentMethods.filter((method) => method.currency === args.currency),
  },
};
