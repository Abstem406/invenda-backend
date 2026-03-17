
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const SOFT_DELETE_MODELS = [
    'User',
    'Category',
    'Product',
    'ProductPrice',
    'Sale',
    'SaleItem',
];

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        super({ adapter }); // Initialize the base client first

        const extended = this.$extends({
            query: {
                $allModels: {
                    $allOperations: async ({ model, operation, args, query }) => {
                        if (!model || !SOFT_DELETE_MODELS.includes(model)) {
                            return query(args);
                        }

                        if (operation === 'delete') {
                            return (this as any)[model].update({
                                ...(args as any),
                                data: { deletedAt: new Date() },
                            });
                        }

                        if (operation === 'deleteMany') {
                            return (this as any)[model].updateMany({
                                ...(args as any),
                                data: { ...(args as any)?.data, deletedAt: new Date() },
                            });
                        }

                        const readOps = [
                            'findFirst', 'findMany', 'findUnique', 'count',
                            'findFirstOrThrow', 'findUniqueOrThrow', 'aggregate', 'groupBy'
                        ];

                        if (readOps.includes(operation)) {
                            if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
                                const newOp = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
                                return (this as any)[model][newOp]({
                                    ...(args as any),
                                    where: { ...(args as any)?.where, deletedAt: null }
                                });
                            }

                            return query({
                                ...(args as any),
                                where: { ...(args as any)?.where, deletedAt: null }
                            });
                        }

                        return query(args);
                    }
                }
            }
        });

        // NestJS requires onModuleInit to be present on the returned object
        (extended as any).onModuleInit = async () => {
            await this.$connect();
        };

        return extended as any;
    }

    async onModuleInit() {
        await this.$connect();
    }
}
