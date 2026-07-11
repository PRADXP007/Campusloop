# CampusLoop — SMTP & Email Delivery Setup Guide

This guide details how to configure secure email delivery using Google Gmail SMTP and Gmail App Passwords, and how to use the built-in test endpoint to verify connections.

---

## 1. How to Generate a Gmail App Password

If you use a Gmail account (`@gmail.com`) or a custom Google Workspace email address, standard password login is disabled by default for security. You must generate a **16-digit App Password** to allow Nodemailer to send emails:

1. Go to your [Google Account settings](https://myaccount.google.com/).
2. Navigate to **Security** on the left menu.
3. Under *How you sign in to Google*, ensure **2-Step Verification** is enabled. (This is required to generate App Passwords).
4. Select **2-Step Verification**, scroll to the bottom, and click on **App passwords**.
5. Give the app password a name (e.g. `CampusLoop Dev`).
6. Click **Create**.
7. Google will display a **16-character password** (e.g. `abcd efgh ijkl mnop`). Copy this code and remove any spaces when adding it to your `.env` configuration file.

---

## 2. Environment Configuration

Add the following environment variables to your [campusloop-server/.env](file:///Users/pradeeph/Documents/campus%20loop/campusloop-server/.env) file:

```env
# SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_16_digit_app_password_without_spaces
```

> [!NOTE]
> - **Port 587 (STARTTLS)**: Uses `secure: false` (secure upgrade starts via STARTTLS). This is the default recommended configuration.
> - **Port 465 (SSL/TLS)**: Set `SMTP_PORT=465` to automatically switch the connection to use `secure: true`.

---

## 3. Verifying Connections via the Test Endpoint

We have implemented a test endpoint to instantly verify that email delivery works without needing to run through the entire registration flow.

### How to use:

Send a `POST` request to `/api/v1/auth/test-email` (with a JSON body specifying the target recipient):

- **Method**: `POST`
- **URL**: `http://localhost:5005/api/v1/auth/test-email`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "to": "test-recipient@example.com"
  }
  ```

> [!TIP]
> If you do not specify a `"to"` field in the request body, the server will automatically default to sending the test email to the configured `SMTP_USER` address.

#### Example successful response:
```json
{
  "success": true,
  "message": "Test verification email successfully delivered to test-recipient@example.com!"
}
```

#### Example error response (if SMTP fails):
```json
{
  "success": false,
  "message": "Email delivery failed: Invalid login: 535-5.7.8 Username and Password not accepted..."
}
```
