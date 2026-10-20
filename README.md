# CivicConnect — Public Service Request System

## 1. Project Overview

CivicConnect is a web application that allows citizens to report public service problems and track their progress. An administrator can view submitted requests and update their status

Citizens can create accounts, log in, submit service requests, and check the progress of their requests. The administrator can view submitted requests and update their status.

## 2. Project Objectives

- Enable citizens to create accounts and securely log in.
- Allow citizens to report public service issues online.
- Store service requests in a database.
- Allow citizens to track the status of their requests.
- Provide administrators with a dashboard for managing service requests.
- Enable administrators to update request statuses.
- Display statistics on pending, in-progress, and resolved requests.

## 3. Main Features

### Citizen Portal

Create an account and log in.

Submit a public service request.

Provide the request category, location, and description.

View submitted requests.

Track request status, such as Pending, In Progress, and Resolved.

### Administrator Dashboard

-Log in using the administrator account.

View requests submitted by citizens.

Update the status of a request.

Help track requests from submission to resolution.

## 4. Technologies Used

Vite – Used to run the frontend during development.

JavaScript – Used to implement the application's functionality.

CSS – Used to style the interface.

Node.js – Used to run the backend.

Express.js – Used to create the API.

SQLite – Used to store user accounts and service requests.

bcryptjs – Used to hash passwords.

JSON Web Token (JWT) – Used for authentication.

CORS – Used to control requests between the frontend and backend.

## 5. System Requirements

To run this project, you need:

Node.js and npm installed on your computer.

A code editor such as Visual Studio Code.

A web browser.

## 6. Project Structure

public-service-system/
├── public/
├── server/
│ ├── server.js
│ ├── .env
│ └── civicconnect.db
├── src/
│ ├── App.jsx
│ └── index.css
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md

TThe database file is created by the backend when the application initializes. The exact files in the folders may vary depending on the project setup.

## 7. Installation and Setup

### Step 1: Install Frontend Dependencies

Open a terminal in the `public-service-system` project folder and run:

```powershell
npm install
```

### Step 2: Install Backend Dependencies

Navigate to the server directory:

```powershell
cd server
```

Install the backend dependencies:

```powershell
npm install
```

### Step 3: Configure Environment Variables

Create or check the .env file inside the server folder. It should contain the following settings, using your own local values:

```env
PORT=5000
JWT_SECRET=replace_with_a_long_random_secret
ADMIN_EMAIL=admin@civicconnect.local
ADMIN_PASSWORD=replace_with_a_strong_password
```

Replace the example secret and password with your own secure values. The administrator password must contain at least 12 characters.

Keep `.env` private and do not upload it to a public repository.

### Step 4: Start the Backend Server

From the `server` directory, run:

```powershell
node server.js
```

The backend should start on port 5000

`http://localhost:5000`

### Step 5: Start the React Frontend

Open a second terminal in Visual Studio Code. Navigate to the project root:

```powershell
cd ..
```

If the second terminal is already in the project root, you do not need this command.

Start the frontend:

```powershell
npm run dev
```

If PowerShell blocks the npm script, use:

```powershell
npm.cmd run dev
```

Open the local URL displayed in the terminal, usually `http://localhost:5173/`. If that port is occupied, Vite may select another port.

Keep both terminals running while using the application.

## 8. How to Use the System

A citizen registers or logs in.

The citizen submits a public service request with its category, location, and description.

The request is saved in the SQLite database.

The administrator logs in and views the submitted requests.

The administrator updates a request's status.

The citizen can log in again to check the latest status.

## 9. API Endpoints

Method, endpoint and purpose

POST-/api/auth/register. purpose is register a citizen

POST- /api/auth/login. purpose is log in

GET-/api/requests . purpose is to Retrieve requests accessible to the logged-in user

POST-/api/requests. purpose is to Submit a new request

PATCH-/api/requests/:id/status. purpose is to Update a request's status as an administrator

GET- /api/health. purpose is to Check whether the API is running |

## 10. Testing

The system can be tested by registering a citizen account, submitting a service request, logging in as an administrator, and changing the request status. The citizen can then log in again to confirm that the updated status is displayed.

## 11. Limitations and Future Improvements

Possible improvements include adding email notifications, allowing citizens to upload photos of reported problems, and providing reports showing the number and types of requests submitted.

## 12. Conclusion

CivicConnect provides a simple way to submit and track public service requests. The project demonstrates how a frontend, backend API, authentication, and database can work together in a web application.
