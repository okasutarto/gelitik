/**
 * Base interface for Social Media Platform Services
 */
export interface PlatformAuthResult {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    scope?: string;
    platformUserId: string;
    username: string;
    displayName: string;
    avatar?: string;
}

export interface PlatformService {
    /**
     * Generates the OAuth URL to redirect the user to
     */
    getAuthUrl(state?: string): string;

    /**
     * Exchanges the authorization code for tokens
     */
    exchangeCode(code: string): Promise<PlatformAuthResult>;

    /**
     * Refreshes the access token if supported
     */
    refreshToken(refreshToken: string): Promise<PlatformAuthResult>;

    /**
     * Fetches user profile
     */
    getProfile(accessToken: string): Promise<any>;

    /**
     * Fetches insights/analytics for the account
     */
    getAnalytics(accessToken: string, accountId: string, startDate: Date, endDate: Date): Promise<any>;
}
