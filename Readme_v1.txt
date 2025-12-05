Step 1
Importing of SQL DB

1.Open MySQL Workbench
2.Connect to their local MySQL server

Step 2:
Run this query:
CREATE DATABASE IF NOT EXISTS play2learn;

Step 3: Import Your File

Click Server in the top menu
Click Data Import
Select "Import from Self-Contained File"
Click Browse and select the play2learn_backup.sql file you sent
Under "Default Target Schema":

Select play2learn from dropdown


Click Start Import at the bottom right
Wait for it to finish

Step 4: Verification
USE play2learn;
SELECT * FROM users;
* It should display all the user that was created by me, alternative you can just sign up one dummy account.

email: John@test.com password: W3lcome2025! Role: Student
email: smith@test.com password: Teacher2025! Role: Teacher
email: tammy@test.com password: W3lcome2025! Role: Student


* Key Things to take note

1. Under backend there is a file name:.env
2. You can just use notepad to input your MySQL root password

Example:
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=W3lc0me2026! ( *THIS IS WHERE YOU NEED TO CHANGE )
DB_NAME=play2learn

How Running of Backend Works:
1. Open terminal under administrator
2. cd to the file eg:C:\Users\simpl\Desktop\Play2Learn_Test\backend
3. npm install
4. npm start

Expected output :

> play2learn-backend@1.0.0 start
> node server.js


╔════════════════════════════════════════╗
║   🚀 Play2Learn Server Running        ║
║   📍 Port: 5000                        ║
║   🌐 http://localhost:5000            ║
║   💾 Database: MySQL                   ║
╚════════════════════════════════════════╝

✅ Connected to MySQL database





