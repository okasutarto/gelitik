// Test file with bugs to fix
const API_KEY = "sk-secret-key-12345";

export function calculatePrice(price: number, quantity: number) {
    // Bug: no input validation
    return price * quantity;
}

export function getUserData(userId: string) {
    // Bug: SQL injection via string concatenation
    const query = "SELECT * FROM users WHERE id = " + userId;
    return fetch('/api/users/' + userId);
}

export function processData(data: string) {
    // Bug: missing error handling
    const result = JSON.parse(data);
    return result;
}
