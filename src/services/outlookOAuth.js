// Outlook OAuth Token Provider - Similar to C# implementation
// Uses https://outlook.office365.com/.default scope for Mail.Send

const TOKEN_CACHE_KEY = "Outlook_OAuth_Token";
const MICROSOFT_GRAPH_SCOPE = "https://outlook.office365.com/.default";

let cachedToken = null;
let tokenExpiry = null;

/**
 * Get access token from Azure AD using client credentials flow
 * Caches the token until expiry to avoid unnecessary API calls
 */
async function getAccessToken() {
  // Check if we have a valid cached token
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        "Azure credentials not configured. Please set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET"
      );
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: MICROSOFT_GRAPH_SCOPE,
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get access token: ${response.status} - ${errorText}`
      );
    }

    const tokenData = await response.json();

    // Cache the token with expiry time (subtract 5 minutes for safety)
    cachedToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 3600; // Default to 1 hour if not provided
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn - 300); // 5 minutes buffer
    tokenExpiry = expiryDate;

    console.log("Outlook OAuth token obtained successfully");

    return cachedToken;
  } catch (error) {
    console.error("Error obtaining Outlook OAuth token:", error);
    throw error;
  }
}

/**
 * Clear the cached token (useful for testing or forced refresh)
 */
export function clearTokenCache() {
  cachedToken = null;
  tokenExpiry = null;
}

/**
 * Send email via Microsoft Graph API using the Outlook scope
 */
export async function sendMailViaGraph(message) {
  const accessToken = await getAccessToken();
  const serviceMailbox =
    process.env.AZURE_SERVICE_MAILBOX || "noreply@ieracademy.com";

  const graphUrl = `https://graph.microsoft.com/v1.0/users/${serviceMailbox}/sendMail`;

  const response = await fetch(graphUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to send email via Graph API: ${response.status} - ${errorText}`
    );
  }

  return response.json();
}

export { getAccessToken };

