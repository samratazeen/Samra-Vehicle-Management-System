SAMRA VEHICLE SERVICE MANAGEMENT SYSTEM
=======================================

TECHNOLOGIES
- HTML, CSS, JavaScript
- Node.js and Express.js
- MySQL

DATABASE TABLES
1. customers
2. vehicles
3. services
4. payments

IMPORTANT FIELD-NAME CLARIFICATIONS
Your brief contained "service_data DATA", "service* charge", and "payment_data".
This project interprets these as:
- service_date DATE
- service_charge DECIMAL(10,2)
- payment_date DATE

The four-table requirement is preserved. There is no separate mechanics table.
Mechanic/service progress is represented by services.status, which can be updated
from the Service records page. A separate mechanic login/assignment feature would
require an additional mechanics table.

SETUP INSTRUCTIONS
1. Install Node.js and MySQL Server / MySQL Workbench.
2. Extract this ZIP file.
3. Open the extracted Vehicle-Service-Center folder in VS Code.
4. Open database.sql in MySQL Workbench and execute the complete script.
5. In VS Code, open a terminal in the project folder and run:
      npm install
6. Copy .env.example to a new file named .env.
7. Open .env and enter your MySQL password:
      DB_HOST=localhost
      DB_USER=root
      DB_PASSWORD=your_actual_mysql_password
      DB_NAME=samra_vehicle_service
      PORT=3000
   If your MySQL root account has no password, leave DB_PASSWORD blank.
8. Save .env.
9. Start the project:
      npm start
10. Open this address in your browser:
      http://localhost:3000

FEATURES
- Dashboard totals and paid revenue
- Add, view, edit and delete customers
- Register and manage vehicles
- Create service appointments and update service status
- Set service charges
- Record and manage payments
- Search records

DATABASE SAFETY
The backend uses parameterized SQL queries. Foreign-key constraints prevent
deleting parent records that still have dependent records. Delete dependent
payments/services/vehicles before deleting their parent records.

NOTE
This is a college mini-project starter, not a production-ready public service.
Before real-world deployment, add authentication, authorization, validation,
HTTPS, backups and stronger operational security.
