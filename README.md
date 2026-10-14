# RentRight Backend

## Installation Guide

This guide explains how to install, configure, and run the RentRight backend locally.

## 1. Prerequisites

Install the following software before proceeding:

- [Node.js and npm](https://nodejs.org/)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/)
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
- [Git](https://git-scm.com/)

Verify the installations by running the following commands in your terminal:

```bash
node -v
npm -v
git --version
```

## 2. Clone the Repository

Clone the backend repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_BACKEND_DIRECTORY>
```

Replace `<YOUR_REPOSITORY_URL>` with the actual backend repository URL and `<YOUR_BACKEND_DIRECTORY>` with the backend directory name.

## 3. Install Dependencies

Navigate to the backend root directory and run:

```bash
npm install
```

This command installs the dependencies defined in `package.json`.

## 4. Configure Environment Variables

Create a `.env` file in the backend root directory, alongside `package.json`.

**Windows PowerShell:**

```powershell
New-Item -Path .env -ItemType File
```

**Linux / macOS:**

```bash
touch .env
```

Open the `.env` file and add the following configuration:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Authentication & JWT
JWT_SECRET=replace_with_a_secure_development_secret
JWT_EXPIRES_IN=7d
RESET_TOKEN_EXPIRES_MINUTES=60

# MySQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=rootG
DB_PASSWORD=
DB_NAME=rentright_db
DB_CONNECTION_LIMIT=10
```

Save the file.

**Important:**
- Update `DB_USER` and `DB_PASSWORD` to match your MySQL configuration.
- Replace the example `JWT_SECRET` with a secure, randomly generated secret.
- Keep `.env` in the backend root directory.
- Never commit your actual `.env` file to GitHub.

## 5. Configure the MySQL Database

Start your MySQL server and open MySQL Workbench.

### 5.1 Create the Database

Execute the following SQL statement:

```sql
CREATE DATABASE rentright_db;
```

### 5.2 Create a MySQL User

If the MySQL user `rootG` does not already exist, create it using the following SQL statements:

```sql
CREATE USER 'rootG'@'localhost'
IDENTIFIED BY 'your_database_password';

GRANT ALL PRIVILEGES ON rentright_db.*
TO 'rootG'@'localhost';
```

Replace `your_database_password` with a password of your choice.

If the user already exists, do not create it again. Instead, verify that the account has the required database permissions.

### 5.3 Update the Environment Configuration

Update the database settings in your `.env` file:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=rootG
DB_PASSWORD=your_database_password
DB_NAME=rentright_db
DB_CONNECTION_LIMIT=10
```

Use the same password configured for the MySQL user.

**Note:** Creating the database does not automatically create the application tables. If the project includes database migrations, schema files, or SQL scripts, execute the appropriate ones before running the application.

## 6. Check npm Security Vulnerabilities

Check the installed dependencies for known security vulnerabilities:

```bash
npm audit
```

Apply compatible dependency updates:

```bash
npm audit fix
```

Check the results again:

```bash
npm audit
```

Review any remaining vulnerabilities and test the application after updating dependencies.

Avoid using `npm audit fix --force` unless you understand the potential breaking changes.

## 7. Start the Backend Server

Check the available scripts in `package.json`.

If the project defines a development script, run:

```bash
npm run dev
```

Alternatively, if the project defines a start script, run:

```bash
npm start
```

The backend is configured to use port `5000`.

If the server starts successfully, it should be accessible at:

```text
http://localhost:5000
```

The exact response depends on the routes implemented by the backend.

## 8. Environment Variables Reference

| Variable | Description |
|---|---|
| `PORT` | Port used by the backend server |
| `NODE_ENV` | Application environment |
| `CLIENT_URL` | Frontend application URL |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT expiration duration |
| `RESET_TOKEN_EXPIRES_MINUTES` | Password reset token lifetime |
| `DB_HOST` | MySQL server hostname or IP address |
| `DB_PORT` | MySQL server port |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `DB_CONNECTION_LIMIT` | Maximum database connections |

## 9. Git Security Configuration

Create a `.gitignore` file in the backend root directory and add the following entries:

```gitignore
node_modules/
.env
.env.*
!.env.example
npm-debug.log*
.DS_Store
```

This prevents environment files and installed dependencies from being committed to Git.

### Create an `.env.example` File

Create a file named `.env.example` containing the required environment variables and placeholder values:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Authentication & JWT
JWT_SECRET=replace_with_a_secure_secret
JWT_EXPIRES_IN=7d
RESET_TOKEN_EXPIRES_MINUTES=60

# MySQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=rentright_db
DB_CONNECTION_LIMIT=10
```

Commit `.env.example` to Git so other developers can understand which configuration values are required.

**Never commit real credentials, passwords, or production secrets to GitHub.**

## 10. Troubleshooting

### Database Connection Errors

- Ensure the MySQL server is running.
- Verify the database credentials in `.env`.
- Confirm that the `rentright_db` database exists.
- Verify that the MySQL user has the necessary permissions.
- Ensure the MySQL host and port are correct.

### Environment Variables Are Undefined

- Confirm that `.env` is in the backend root directory.
- Ensure the application loads environment variables using `dotenv` or an equivalent configuration mechanism.
- Restart the backend server after modifying `.env`.

### Port Already in Use

If port `5000` is already in use:

- Stop the process using the port, or
- Configure the application to use another available port.

Update the `PORT` variable in `.env` if necessary.

### npm Audit Vulnerabilities

- Run `npm audit` to inspect affected dependencies.
- Run `npm audit fix` to apply compatible fixes.
- Review unresolved vulnerabilities.
- Test the application after dependency updates.

### Database Tables Are Missing

Creating `rentright_db` creates an empty database.

Check the project for migration files, schema definitions, or SQL scripts and execute the appropriate database initialization procedure.

## License

Add the project's license information here. If the project does not currently have a license, confirm the intended licensing terms before adding one.
