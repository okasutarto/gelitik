// Test file with bugs to fix
const API_KEY = process.env.API_KEY; // Use environment variable instead of hardcoded secret

export function calculatePrice(price: number, quantity: number): number {
    // Bug: no input validation - FIXED
    if (typeof price !== 'number' || typeof quantity !== 'number') {
        throw new Error('Price and quantity must be numbers');
    }
    if (price < 0 || quantity < 0) {
        throw new Error('Price and quantity must be non-negative');
    }
    return price * quantity;
}

export function getUserData(userId: string): Promise<Response> {
    // Bug: SQL injection via string concatenation - FIXED: use encodeURIComponent
    if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId');
    }
    return fetch('/api/users/' + encodeURIComponent(userId));
}

export function processData(data: string): unknown {
    // Bug: missing error handling - FIXED
    try {
        const result = JSON.parse(data);
        return result;
    } catch (error) {
        throw new Error('Invalid JSON data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}
