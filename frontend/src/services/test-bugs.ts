// Test service with intentional bugs for code review
const API_KEY = process.env.API_KEY; // Use environment variable instead of hardcoded key

export interface User {
    id: number;
    name: string;
    email: string;
}

// SQL injection vulnerability - SECURITY ISSUE - FIXED: use parameterized query via API
export async function getUserById(userId: string): Promise<User | null> {
    if (!userId || typeof userId !== 'string') {
        return null;
    }
    return fetch(`/api/users?id=${encodeURIComponent(userId)}`).then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    });
}

// Missing error handling - CODE QUALITY ISSUE - FIXED
export async function fetchUserData(userId: number) {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
    }
    return response.json();
}

// No input validation - SECURITY ISSUE - FIXED
export function processPayment(amount: number, cardNumber: string) {
    // Validate inputs
    if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
        throw new Error('Invalid amount');
    }
    if (typeof cardNumber !== 'string' || !/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
        throw new Error('Invalid card number');
    }
    return fetch('/api/payment', {
        method: 'POST',
        body: JSON.stringify({ amount, cardNumber })
    });
}

// Magic numbers - BEST PRACTICE ISSUE - FIXED
const SCORE_MULTIPLIER = 100;
const SECONDS_PER_MINUTE = 60;

export function calculateScore(time: number) {
    return time * SCORE_MULTIPLIER / SECONDS_PER_MINUTE;
}

// Mutating parameter - CODE QUALITY ISSUE - FIXED: return new array
export function addItem(items: string[], item: string) {
    return [...items, item];
}

export default { getUserById, fetchUserData, processPayment, calculateScore, addItem };
