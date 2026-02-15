import { PrismaClient } from '@prisma/client';

type PrismaClientType = ReturnType<typeof PrismaClient['prototype']['$extends']>;

declare global {
  // This prevents multiple instances of Prisma Client in development
  var prisma: PrismaClient | undefined;
}

// Client mock par défaut avec les méthodes de base
const mockPrisma: PrismaClient = {
  $connect: async () => console.log("MOCK: $connect"),
  $disconnect: async () => console.log("MOCK: $disconnect"),
  $on: () => console.log("MOCK: $on"),
  $transaction: async (callback: any) => {
    console.log("MOCK: $transaction");
    return callback(mockPrisma);
  },
  $use: () => {},
  $extends: () => ({} as any),
  $executeRaw: () => Promise.resolve(0),
  $executeRawUnsafe: () => Promise.resolve(0),
  $queryRaw: () => Promise.resolve([]),
  $queryRawUnsafe: () => Promise.resolve([]),
  
  // Add all your models here with proper typing
  document: {
    findUnique: async (args: any) => {
      console.log("MOCK: findUnique", args);
      return null;
    },
    findMany: async (args: any) => {
      console.log("MOCK: findMany", args);
      return [];
    },
    create: async (args: any) => {
      console.log("MOCK: create", args);
      return { 
        id: "mock-" + Math.random().toString(36).slice(2, 8),
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        versions: []
      } as any;
    },
    update: async (args: any) => {
      console.log("MOCK: update", args);
      return { 
        id: args.where.id,
        ...args.data,
        updatedAt: new Date()
      } as any;
    },
    delete: async (args: any) => {
      console.log("MOCK: delete", args);
      return {} as any;
    },
    count: async (args: any) => {
      console.log("MOCK: count", args);
      return 0;
    }
  },
  documentTag: {
    deleteMany: async (args: any) => {
      console.log("MOCK: documentTag.deleteMany", args);
      return { count: 0 };
    }
  },
  // Add other models as needed
} as unknown as PrismaClient;

// Create a single PrismaClient instance and save it on the global object in development
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
