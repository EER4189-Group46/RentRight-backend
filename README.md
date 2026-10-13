The backend of RentRight is developed using Node.js and Express.js, with PostgreSQL as the database. It handles the core business logic, processes requests from the frontend, manages user authentication, and communicates with the database to store and retrieve information.

The backend supports essential functionalities such as user registration and login, item browsing and searching, item listing management, rental request processing, online payments, messaging, ratings and reviews, and provider earnings. It also manages role-based access for Renters, Item Providers, and Administrators to ensure users can access the appropriate system features.

The backend exposes APIs that allow the React frontend to communicate with the server. PostgreSQL stores and manages related data, including user accounts, items, categories, rental requests, payments, and reviews. Security measures such as password hashing, input validation, and access control are important parts of the backend design.

Current progress: The authentication and browse-and-search functionalities have been completed on both the frontend and backend. The remaining backend modules are being developed and integrated progressively.The backend provides the foundation for RentRight by connecting the user interface, database, and rental business processes into one integrated system.
