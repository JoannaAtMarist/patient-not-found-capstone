# Patient Not Found — Local Startup Guide  
Updated 12/8/2025.  
<br>  

*(Node.js / Express / MongoDB / Swagger / WSL2)*

This guide covers setup for:
- Windows 11 + WSL2 Ubuntu 24.04  
- macOS  
- Linux  

---

## 1. System Prerequisites

### Windows Users — Install WSL2 + Ubuntu 24.04

```powershell
wsl --install -d Ubuntu-24.04
wsl --set-default Ubuntu-24.04
```

Start Ubuntu:

```powershell
wsl
```

---

## 2. Install Node.js 22 (Required)

Using **nvm** (recommended on all systems):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

Verify:

```bash
node -v
npm -v
```

---

## 3. MongoDB (Atlas Only — No Local Server Needed)

We no longer run Mongo locally.  
The MONGO_URI points to MongoDB Atlas, and the backend connects automatically.  

---  

## 4. Auth0 Setup (required for login in STANDARD mode)

To use the real login flow when `APP_MODE=standard`, you need an Auth0 tenant and app configured:  

1. Create an Auth0 application  
   - Sign in to Auth0 and create a Regular Web Application.  
   - Note your Domain, Client ID, and Client Secret.  

2. Configure URLs in Auth0  
    In the application Settings, set:  
    - Allowed Callback URLs:  
    `http://localhost:3000/callback`  
    - Allowed Logout URLs:  
    `http://localhost:3000/landing`  
    - Allowed Web Origins:  
    `http://localhost:3000`  

3. Set core Auth0 environment variables  
  In your `.env` (do not commit this file), add or update:  
  ```  
  AUTH0_ISSUER_BASE_URL=https://YOUR-TENANT.us.auth0.com
  AUTH0_BASE_URL=http://localhost:3000
  AUTH0_CLIENT_ID=your_client_id_here
  AUTH0_SECRET=your_long_random_secret_here
  ```  

4. (Optional) Management API for auto-provisioning Accounts  
  If you want the Auth0 -> Mongo user sync feature to work, also set:   
  ```  
  AUTH0_DOMAIN=YOUR-TENANT.us.auth0.com
  AUTH0_MGMT_CLIENT_ID=your_m2m_client_id
  AUTH0_MGMT_CLIENT_SECRET=your_m2m_client_secret
  AUTH0_MGMT_AUDIENCE=https://YOUR-TENANT.us.auth0.com/api/v2/
  ```  

5. Restart and verify  
Run the server again. In the startup logs you should see lines like:  
`🔐 Auth0 middleware enabled`  
`STEP 5... Auth0 to Mongo Bridge....`  
If Auth0 is misconfigured, you’ll see:  
`❌ Auth0 config is incomplete. Check AUTH0_* env vars.`  
   

>Note: In `APP_MODE=dev`, Auth0 is not required — `/login` serves a local `login.html` instead. Auth0 is only mandatory for “real” login in `standard` mode.


## 5. Clone the Project

```bash
cd ~
git clone git@github.com:JoannaAtMarist/404pnf.git
cd 404pnf
```

---

## 6. Create .env File in Project Root

```bash
nano .env
```
  
[env.example](../../docs/official/env.example) 

---

## 7. Install Backend Dependencies

Go to backend folder:

```bash
cd server
npm install
```  

Combined Dependencies Install:  
```  
npm install express express-session mongoose dotenv body-parser bcryptjs cors connect-mongo openai swagger-ui-express yamljs multer pdf-parse mammoth  
```  

---

## 8. Start the Server

From project root:

```bash
node server/server.js
```

Expected console output with Modes OpenAI, Normal, and Standard:

```
[dotenv@17.2.3] injecting env (17) from .env
[env] module loaded
❔ AI mode:openai
[env]💭 Running in OPENAI mode (cloud API)
[env] using summarizeWithOpenAiCloud() as default summarizer
❔ SUMMARY mode:normal
[env]🍦 Vanilla Summary Mode
❔ APP mode:standard
[env] 📡 STANDARD MODE: login required, Mongo ON, sessions ON
[aiBootstrap] module loaded
🔑 [aiBootstrap] OPENAI_API_KEY exists? true
🤖 [aiBootstrap] AI_MODE: openai
[dotenv@17.2.3] injecting env (0) from .env
STEP 1... Connecting to Mongo....
STEP 2... Auth0 config defined....
STEP 3... Sessions set....
🪪 Mongo-backed session store active
STEP 4... Auth0 Middleware....
🔐 Auth0 middleware enabled
STEP 5... Auth0 to Mongo Bridge....
STEP 6... no cache....
STEP 7... Safe Logger....
STEP 8... Auth Routes Loading....
STEP 9... All Routes Loading....
🐾 viewsPath: /home/zixi/404pnf/client/views
🧸 Swagger load success.
🖥️ Server running at http://localhost:3000
📘 Swagger UI available at http://localhost:3000/api-docs
🔒 STANDARD MODE ACTIVE
🥭 MongoDB connection ready.
🥭 Connected to MongoDB

```  
(Emojis were added for whimsy and quick reference while debugging.)

---

## 9. Open the Application

### App:
http://localhost:3000

### Swagger:
http://localhost:3000/api-docs

---

## 10. Troubleshooting

### Missing OpenAI Key
Create `.env` in project root.

### Missing Dependencies
Run:

```bash
cd server
npm install
```

### MongoDB Connection Error

Check IP whitelist in Atlas.

### ES Module Warning
Add this to `package.json`:

```json
{
  "type": "module"
}
```

---

Everything should now run on Windows+WSL, macOS, and Linux.
