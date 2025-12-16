# PNF Dependency Checklist (Updated 12/8/2025)

This is the current, accurate list of what must be installed for our project to run locally on:

- Windows 11 + WSL2 Ubuntu 24.04
- macOS
- Linux

## Core System Requirements

| Tool                         | Version      | Required? | Notes                                |
| ---------------------------- | ------------ | --------- | ------------------------------------ |
| **Node.js**                  | **v22.x**    | ✅         | Required for ESM & new OpenAI client |
| **npm**                      | 10–11        | Auto      | Installed with Node                  |
| **MongoDB Community Server** | v7.x         | ✅         | Local dev only; Atlas optional       |
| **Git**                      | latest       | ✅         | For repo access                      |
| **WSL2 (Windows only)**      | Ubuntu 24.04 | Optional  | Strongly recommended on Windows      |

## Backend npm Dependencies  

Install from inside /server:  
``` 
npm install express
npm install express-session
npm install mongoose
npm install dotenv
npm install body-parser
npm install bcryptjs
npm install cors
npm install connect-mongo
npm install openai
npm install swagger-ui-express
npm install yamljs
npm install multer
npm install pdf-parse
npm install mammoth
npm install auth0
npm install express-openid-connect
npm install node-fetch
```  

Or combined install:  
```  
npm install express express-session mongoose dotenv body-parser bcryptjs cors connect-mongo openai swagger-ui-express yamljs multer pdf-parse mammoth auth0 express-openid-connect node-fetch
```  

## Environment Variables (.env)  

Place .env in project root (~/404pnf/.env):  
[env.example](../../docs/official/env.example)  
 

