# Azure 365 Email Integration Setup Guide

This guide explains how to configure your IER Academy backend to send emails using Microsoft 365/Exchange Online via the Microsoft Graph API.

## Prerequisites

- An Azure AD subscription (Microsoft 365 subscription)
- Administrator access to Azure Portal
- A Microsoft 365 mailbox for sending emails (e.g., `noreply@ieracademy.com`)

## Step 1: Register Application in Azure AD

1. **Navigate to Azure Portal**
   - Go to https://portal.azure.com
   - Sign in with your admin credentials

2. **Create App Registration**
   - Navigate to **Azure Active Directory** > **App registrations**
   - Click **"New registration"**
   - Enter a name (e.g., "IER Academy Email Service")
   - Select **"Accounts in this organizational directory only"**
   - Click **"Register"**

3. **Note Down Important Information**
   - Copy the **Application (client) ID** - this is your `AZURE_CLIENT_ID`
   - Copy the **Directory (tenant) ID** - this is your `AZURE_TENANT_ID`

## Step 2: Create Client Secret

1. **Generate Secret**
   - In your app registration, navigate to **"Certificates & secrets"**
   - Click **"New client secret"**
   - Add a description (e.g., "Email Service Secret")
   - Select expiration (12 or 24 months recommended)
   - Click **"Add"**

2. **Copy the Secret Value**
   - **IMPORTANT**: Copy the secret value immediately - you won't be able to see it again
   - This is your `AZURE_CLIENT_SECRET`
   - Store it securely

## Step 3: Configure API Permissions

1. **Add Microsoft Graph Permissions**
   - Navigate to **"API permissions"**
   - Click **"Add a permission"**
   - Select **"Microsoft Graph"**
   - Choose **"Application permissions"** (not Delegated)
   - Search for and select: **`Mail.Send`**
   - Click **"Add permissions"**

2. **Grant Admin Consent**
   - Click the **"Grant admin consent for [Your Organization]"** button
   - Confirm the action
   - Status should change to green checkmarks

## Step 4: Configure Mailbox Permissions

Since you're using application permissions (app-only auth), you need to grant the app permission to send emails on behalf of the mailbox.

### Option A: Using Exchange PowerShell (Recommended)

1. **Connect to Exchange Online**
   ```powershell
   Connect-ExchangeOnline
   ```

2. **Grant App Permission**
   ```powershell
   # Replace with your service mailbox email
   $mailbox = "noreply@ieracademy.com"
   
   # Get the app's client ID
   $appId = "your-client-id-here"
   
   # Grant the app permission to send as this mailbox
   Add-MailboxPermission -Identity $mailbox -User $appId -AccessRights FullAccess -AutoMapping $false
   ```

### Option B: Using Azure Portal (Service Principal)

1. **Create Service Principal**
   - In Azure AD, go to **"Enterprise applications"**
   - Find your app by Application (client) ID
   - Note the **Object ID** of the service principal

2. **Grant Mailbox Permissions**
   - In Microsoft 365 Admin Center, assign the service principal permission to the mailbox
   - Or use Exchange Admin Center to grant delegate permissions

## Step 5: Configure Environment Variables

Update your `.env` file with the credentials:

```env
# Azure 365 Email Configuration
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here
AZURE_SERVICE_MAILBOX=noreply@ieracademy.com
```

## Step 6: Install Dependencies

Run the following command to install the Microsoft Graph SDK:

```bash
npm install
```

The `@microsoft/microsoft-graph-client` package is already in `package.json`.

## Step 7: Test the Integration

1. **Start your application**
   ```bash
   npm run dev
   ```

2. **Trigger an email**
   - Create an enrollment in the system
   - Check the logs for any errors
   - Verify the email was sent successfully

## Troubleshooting

### Error: "Insufficient privileges to complete the operation"
- **Solution**: Ensure you granted admin consent for the Mail.Send permission
- Verify the mailbox has the correct permissions

### Error: "InvalidAuthenticationToken"
- **Solution**: Check that your `AZURE_CLIENT_SECRET` hasn't expired
- Verify the credentials are correct in `.env`

### Error: "Mailbox not found"
- **Solution**: Ensure `AZURE_SERVICE_MAILBOX` is correct and exists in your tenant
- Verify the mailbox is properly licensed

### Emails not sending
- Check Azure AD sign-in logs for authentication errors
- Verify the app registration has correct permissions
- Ensure the service mailbox exists and is active

## Security Best Practices

1. **Rotate Secrets Regularly**
   - Set expiration dates on client secrets
   - Rotate secrets every 6-12 months

2. **Least Privilege**
   - Only grant the Mail.Send permission (not full mailbox access)

3. **Monitor Usage**
   - Enable audit logs in Azure AD
   - Monitor email sending activity

4. **Secure Storage**
   - Never commit secrets to version control
   - Use Azure Key Vault for production environments

## Production Deployment

For production deployment on Azure:

1. **Use Azure Key Vault**
   - Store secrets in Azure Key Vault
   - Configure managed identity for your app

2. **Configure App Settings**
   - In Azure App Service, add configuration settings
   - Link to Key Vault references

3. **Enable Logging**
   - Configure Application Insights
   - Monitor email delivery rates

## Additional Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/api/overview)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Send Mail API Reference](https://docs.microsoft.com/en-us/graph/api/user-sendmail)

## Support

For issues with Azure 365 email integration:
- Contact your Azure administrator
- Check the Microsoft 365 admin center
- Review Azure AD audit logs

