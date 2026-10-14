RentRight Backend

Installation Guide

1. Prerequisites

Install the following software:

- Node.js and npm
- MySQL Server
- Git

Verify the installation:

node -v
npm -v
git --version

2. Clone the Repository

git clone <YOUR_REPOSITORY_URL>
cd <YOUR_BACKEND_DIRECTORY>

Replace the placeholders with your actual repository URL and backend directory name.

3. Install Dependencies

Run the following command in the backend root directory:

npm install

4. Create the ".env" File

Create a file named ".env" in the root directory, alongside "package.json".

Windows PowerShell:

New-Item -Path .env -ItemType File

Linux / macOS:

touch .env

Open the ".env" file and copy and paste the following configuration:

PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Authentication & JWT
JWT_SECRET=rentright_jwt_secure_key_development_secret_2026
JWT_EXPIRES_IN=7d
RESET_TOKEN_EXPIRES_MINUTES=60

# MySQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=rootG
DB_PASSWORD=
DB_NAME=rentright_db
DB_CONNECTION_LIMIT=10

Save the file.

Important: Make sure the ".env" file is located in the backend root directory. Update "DB_USER" and "DB_PASSWORD" according to your MySQL configuration.

5. Configure MySQL Database

Start your MySQL server and open MySQL Workbench.

Create the database:

CREATE DATABASE rentright_db;

If the MySQL user "rootG" does not exist, create it and grant database permissions:

CREATE USER 'rootG'@'localhost'
IDENTIFIED BY 'your_database_password';

GRANT ALL PRIVILEGES ON rentright_db.*
TO 'rootG'@'localhost';

Update the ".env" file with the password you configured:

DB_USER=rootG
DB_PASSWORD=your_database_password
DB_NAME=rentright_db

If the user already exists, do not create it again. Ensure the account has the required permissions.

Database tables may need to be created separately using the project's migrations or schema scripts.

6. Fix npm Security Vulnerabilities

Check for security vulnerabilities:

npm audit

Automatically apply compatible dependency fixes:

npm audit fix

Check the results:

npm audit

Review any remaining vulnerabilities and test the application after updating dependencies.

Avoid "npm audit fix --force" unless you have reviewed the potential breaking changes.

7. Start the Backend Server

Run the development server if the project defines a "dev" script:

npm run dev

Alternatively, if the project defines a "start" script:

npm start

The backend is configured to use port "5000".

8. Environment Variables

Variable| Description
"PORT"| Backend server port
"NODE_ENV"| Application environment
"CLIENT_URL"| Frontend URL
"JWT_SECRET"| JWT signing secret
"JWT_EXPIRES_IN"| JWT expiration duration
"RESET_TOKEN_EXPIRES_MINUTES"| Password reset token lifetime
"DB_HOST"| MySQL hostname
"DB_PORT"| MySQL port
"DB_USER"| MySQL username
"DB_PASSWORD"| MySQL password
"DB_NAME"| Database name
"DB_CONNECTION_LIMIT"| Maximum database connections

9. Git Security Configuration

Create a ".gitignore" file in the backend root directory and add:

node_modules/
.env
.env.*
!.env.example
npm-debug.log*
.DS_Store

This prevents environment files and installed dependencies from being committed to Git.

Create an ".env.example" file containing the required variable names and placeholder values, without real secrets or passwords.

Never commit your actual ".env" file to GitHub.

10. Troubleshooting

Database connection errors

- Ensure MySQL is running.
- Check database credentials.
- Confirm that "rentright_db" exists.
- Verify that the MySQL user has the necessary permissions.

Environment variables are undefined

- Confirm that ".env" is in the backend root directory.
- Ensure the application loads environment variables using "dotenv" or an equivalent configuration.
- Restart the server after modifying ".env".

Port already in use

- Stop the process using port "5000", or configure another available port.

npm audit vulnerabilities

- Run "npm audit" to inspect affected packages.
- Run "npm audit fix" to apply compatible fixes.
- Review remaining vulnerabilities and test the application.

License

Update this section with the project's license information.
