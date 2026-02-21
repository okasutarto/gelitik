import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const p = new PrismaClient();
async function main() {
    const user = await p.user.findFirst();
    if (user) {
        console.log("USER:", user.email);
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key');
        console.log("TOKEN:", token);
        console.log("LOCALSTORAGE_USER:", JSON.stringify(user));
    } else {
        console.log("NO USERS FOUND");
    }
}
main().finally(() => p.$disconnect());
