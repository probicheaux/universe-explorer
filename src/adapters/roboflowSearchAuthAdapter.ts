import { google } from "googleapis";
import { getEnv, getB64Env } from "@/utils/environment";

/**
 * Manages authentication tokens for the roboflow search backend service
 */
class SearchBackendAuth {
  private _tokenPromise: Promise<string> | null;
  private _tokenExpiry: number | null;
  private _refreshInterval: NodeJS.Timeout | null;
  private _refreshIntervalMs: number;

  constructor() {
    this._tokenPromise = null;
    this._tokenExpiry = null;
    this._refreshInterval = null;
    this._refreshIntervalMs = 45 * 60 * 1000; // 45 minutes
  }

  /**
   * Get a valid authentication token for the search backend
   * @returns {Promise<string>} A promise that resolves to the JWT token
   */
  async getToken(): Promise<string> {
    const isTokenExpired = this._tokenExpiry
      ? Date.now() > this._tokenExpiry - 5 * 60 * 1000 // 5-minute buffer
      : true;

    if (!this._tokenPromise || isTokenExpired) {
      await this._refreshToken();
      this._startRefreshInterval();
    }
    return (
      this._tokenPromise || Promise.reject(new Error("Token not available"))
    );
  }

  /**
   * Refresh the authentication token
   * @private
   */
  private async _refreshToken(): Promise<void> {
    try {
      // Get the service account key from base64-encoded environment variable
      const serviceAccountKey = JSON.parse(
        getB64Env("SEARCH_INVOKER_SECRET_JSON_B64")
      );

      // Get the Cloud Run service URL from environment variable
      const queryUrl = getEnv("SEARCH_CONFIG_QUERY_URL");
      const audience = queryUrl.replace("/query-datasets", "");

      const jwtClient = new google.auth.JWT(
        serviceAccountKey.client_email,
        undefined,
        serviceAccountKey.private_key,
        audience
      );

      // Create a new promise for the token
      this._tokenPromise = new Promise<string>((resolve, reject) => {
        jwtClient.authorize((err, token) => {
          if (err) {
            console.error("Failed to authorize JWT client:", err);
            // Retry after 10 seconds
            setTimeout(() => this._refreshToken(), 10000);
            reject(err);
          } else {
            if (token?.expiry_date) {
              this._tokenExpiry = token.expiry_date;
            }
            resolve(token?.id_token ?? "");
          }
        });
      });
    } catch (error) {
      console.error("Error refreshing token:", error);
      // Retry after 10 seconds
      setTimeout(() => this._refreshToken(), 10000);
      throw error;
    }
  }

  /**
   * Start the interval to refresh the token periodically
   * @private
   */
  private _startRefreshInterval(): void {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }

    this._refreshInterval = setInterval(() => {
      this._refreshToken().catch((error) => {
        console.error("Error in refresh interval:", error);
      });
    }, this._refreshIntervalMs);
  }

  /**
   * Clean up resources when no longer needed
   */
  cleanup(): void {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = null;
    }
    this._tokenPromise = null;
    this._tokenExpiry = null;
  }
}

// Create a singleton instance
const searchBackendAuth = new SearchBackendAuth();

// Export the instance methods
export const getSearchBackendAuthToken = (): Promise<string> =>
  searchBackendAuth.getToken();
export const _clearInterval = (): void => searchBackendAuth.cleanup();
