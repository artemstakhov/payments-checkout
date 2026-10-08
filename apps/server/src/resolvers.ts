import { paymentMethods, createPaymentRecord, type Payment } from './data';

interface CreatePaymentInput {
  paymentMethodId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
}

interface FieldError {
  field: string;
  message: string;
}

interface CreatePaymentSuccessResult {
  __typename: 'CreatePaymentSuccess';
  payment: Payment;
}

interface CreatePaymentErrorResult {
  __typename: 'CreatePaymentError';
  errors: FieldError[];
}

type CreatePaymentResult = CreatePaymentSuccessResult | CreatePaymentErrorResult;

// Keyed by the client-supplied idempotencyKey: a retry with the same key must get back the
// exact same result, success or failure, instead of being processed a second time.
const resultsByIdempotencyKey = new Map<string, CreatePaymentResult>();

function validateCreatePaymentInput(input: CreatePaymentInput): FieldError[] {
  const errors: FieldError[] = [];

  const method = paymentMethods.find((candidate) => candidate.id === input.paymentMethodId);
  if (!method) {
    errors.push({
      field: 'paymentMethodId',
      message: `No payment method with id "${input.paymentMethodId}"`,
    });
  } else if (method.currency !== input.currency) {
    errors.push({
      field: 'currency',
      message: `Payment method "${input.paymentMethodId}" does not support ${input.currency}`,
    });
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    errors.push({
      field: 'amount',
      message: 'amount must be a positive integer, in the smallest currency unit (e.g. cents)',
    });
  }

  return errors;
}

export const resolvers = {
  CreatePaymentResult: {
    __resolveType: (result: CreatePaymentResult) => result.__typename,
  },
  Query: {
    paymentMethods: (_parent: unknown, args: { currency: string }) =>
      paymentMethods.filter((method) => method.currency === args.currency),
  },
  Mutation: {
    createPayment: (_parent: unknown, args: { input: CreatePaymentInput }): CreatePaymentResult => {
      const { input } = args;

      const cached = resultsByIdempotencyKey.get(input.idempotencyKey);
      if (cached) {
        return cached;
      }

      const errors = validateCreatePaymentInput(input);
      const result: CreatePaymentResult =
        errors.length > 0
          ? { __typename: 'CreatePaymentError', errors }
          : { __typename: 'CreatePaymentSuccess', payment: createPaymentRecord(input) };

      resultsByIdempotencyKey.set(input.idempotencyKey, result);
      return result;
    },
  },
};
