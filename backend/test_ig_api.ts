import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const p = new PrismaClient();

async function main() {
    const accounts = await p.socialAccount.findMany({
        where: { platform: 'instagram-graph' }
    });
    console.log(`Found ${accounts.length} instagram accounts.`);

    const graphUrl = 'https://graph.instagram.com/v22.0';
    for (const account of accounts) {
        if (!account.accessToken) continue;
        console.log(`\nTesting account ID: ${account.id}`);
        try {
            console.log("Fetching age/gender...");
            const res = await axios.get(`${graphUrl}/${account.accountId}/insights`, {
                params: { metric: 'follower_demographics', metric_type: 'total_value', period: 'lifetime', timeframe: 'last_30_days', breakdown: 'age,gender', access_token: account.accessToken }
            });
            console.log("AGE/GENDER RESPONSE:");
            console.log(JSON.stringify(res.data, null, 2));

            console.log("Fetching city...");
            const res2 = await axios.get(`${graphUrl}/${account.accountId}/insights`, {
                params: { metric: 'follower_demographics', metric_type: 'total_value', period: 'lifetime', timeframe: 'last_30_days', breakdown: 'city', access_token: account.accessToken }
            });
            console.log("CITY RESPONSE:");
            console.log(JSON.stringify(res2.data, null, 2));
            break; // succeed
        } catch (e: any) {
            console.log("ERROR:", e.response?.data?.error?.message || e.message);
        }
    }
}
main().finally(() => p.$disconnect());
