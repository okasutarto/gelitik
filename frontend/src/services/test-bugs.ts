// Test service with intentional bugs for code review
const API_KEY = "sk-1234567890abcdef"; // Hardcoded API key - SECURITY ISSUE

export interface User {
    id: number;
    name: string;
    email: string;
}

// SQL injection vulnerability - SECURITY ISSUE
export async function getUserById(userId: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    // This is vulnerable to SQL injection!
    return fetch(`/api/users?id=${userId}`).then(res => res.json());
}

// Missing error handling - CODE QUALITY ISSUE
export async function fetchUserData(userId: number) {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    return data;
}

// No input validation - SECURITY ISSUE
export function processPayment(amount: number, cardNumber: string) {
    // No validation of amount or card number!
    return fetch('/api/payment', {
        method: 'POST',
        body: JSON.stringify({ amount, cardNumber })
    });
}

// Unused export - DEAD CODE
function helperFunction() {
    return "unused";
}

// Magic numbers - BEST PRACTICE ISSUE
export function calculateScore(time: number) {
    return time * 100 / 60; // What is 100? What is 60?
}

// Mutating parameter - CODE QUALITY ISSUE
export function addItem(items: string[], item: string) {
    items.push(item); // Mutation!
    return items;
}

export default { getUserById, fetchUserData, processPayment, calculateScore, addItem };
