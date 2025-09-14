
# NGO Sponsorship Dashboard

![NGO Sponsorship Dashboard Screenshot](https://storage.googleapis.com/aistudio-hosting/project-assets/previews/clz3z1a3g00022e6e3ss7g28w/public/Sponsorship%20Dashboard.png)

The **NGO Sponsorship Dashboard** is a comprehensive, full-stack web application designed to streamline the management of a non-profit organization's student sponsorship program. It provides a secure, role-based interface for staff to manage all aspects of student welfare, sponsor relations, financial tracking, and administrative compliance.

The application is architected with a modern React frontend and a robust Django backend, with a focus on user experience, data integrity, and administrative efficiency.

## Key Features

- **Interactive Dashboard**: A central dashboard providing key performance indicators (KPIs) at a glance, with interactive charts for financial trends (income vs. expense) and student status distribution.
- **Comprehensive Student Management**:
    - Detailed student profiles with photos, personal/family information, and risk assessments.
    - Track academic reports and follow-up records over time.
    - Bulk import new students from a spreadsheet (`.xlsx`, `.csv`).
    - Bulk update the status of multiple students at once.
- **Sponsor Management**: A dedicated module to manage sponsor details and view their sponsored students.
- **Financial Tracking**: A full-featured transaction ledger to log income and expenses, categorize transactions, and associate them with specific students.
- **Administrative Tools**:
    - **Task Management**: A to-do list for staff to create, assign, and track administrative tasks.
    - **Government Filings**: A compliance tool to track important deadlines and submissions.
- **Advanced Reporting**: A powerful reporting engine that allows users to generate and download custom reports for student rosters and financial statements in both **CSV** and **PDF** formats.
- **AI Assistant**: An integrated, chat-based AI that allows users to query data using natural language (e.g., "Show me all unsponsored students") and request on-demand report generation.
- **Robust Security & Administration**:
    - **Role-Based Access Control (RBAC)**: A granular permissions system to control access (Create, Read, Update, Delete) for each module.
    - **User Management**: An interface for administrators to invite new users and manage existing user roles.
    - **Audit Log**: A comprehensive log that tracks all significant actions (Creations, Updates, Deletions) performed by users.

## Technology Stack

### Frontend

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (with Dark/Light theme support)
- **Routing**: React Router v6
- **State Management**: React Context API for global state (Auth, UI, Data Lookups).
- **Forms**: React Hook Form with Zod for schema-based validation.
- **Testing**: Vitest for unit and integration testing.
- **API Mocking**: Mock Service Worker (MSW) for development and testing.
- **Data Visualization**: Recharts
- **API Communication**: A custom Fetch-based client with automated JWT authentication and silent token refresh.

### Backend

- **Framework**: Python, Django, Django REST Framework
- **Database**: PostgreSQL (production), SQLite (local development)
- **Authentication**: JWT (via `djangorestframework-simplejwt`) with a custom backend allowing login via email or username.
- **AI Integration**: Google Generative AI (`gemini`) for the AI assistant feature.
- **File Processing**: `openpyxl` and `pandas` for spreadsheet imports; `Pillow` for image handling.
- **File Storage**: Local file system for media uploads (e.g., profile photos, filing attachments).
- **Admin**: Django Admin with `Jazzmin` for an enhanced UI.
- **Deployment**: Gunicorn & Whitenoise for serving the application and static files.

## Key Architectural Concepts

- **API Mocking (MSW)**: The frontend uses Mock Service Worker to intercept API requests during development and testing. This allows for rapid UI development and robust, isolated tests without depending on a live backend. Mocks are defined in `src/mocks/handlers.ts`.

- **API Design**: The backend exposes a RESTful API with JSON responses using `snake_case` keys. The frontend's centralized API client automatically converts these to `camelCase` for idiomatic JavaScript usage.

- **Authentication Flow**: The system uses a JWT-based authentication flow with short-lived access tokens (15 mins) and long-lived refresh tokens (7 days). The frontend features a silent, proactive token refresh mechanism to ensure a seamless user experience without interruptions.

- **Role-Based Access Control (RBAC)**: The backend implements a powerful RBAC system by extending Django's built-in `Group` model with a `RoleProfile`. This profile stores a JSON object defining granular permissions (create, read, update, delete) for each application module. These permissions are sent to the frontend upon login and used to dynamically render the UI.

- **AI Assistant**: The frontend sends user prompts to a dedicated backend endpoint. The backend then securely communicates with the Google Generative AI API, provides it with relevant context from the database, and processes the response. It can return either a natural language answer or a structured JSON payload to trigger actions on the frontend, like generating a report.

- **Audit Logging**: Using Django Signals, the backend automatically creates `AuditLog` entries for all Create, Update, and Delete operations on key models, ensuring a comprehensive and automated paper trail of all data modifications.

## Getting Started

Follow these instructions to get the full-stack application running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- [Python](https://www.python.org/) (v3.10 or later) and `pip`

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the `backend` directory. A minimal configuration for local development is:
    ```
    # backend/.env
    SECRET_KEY='your-strong-secret-key-here'
    # DATABASE_URL is optional, defaults to a local db.sqlite3 file
    # GOOGLE_API_KEY='your-google-api-key-for-gemini'
    ```

5.  **Run database migrations:**
    This will create the `db.sqlite3` file and set up the database schema.
    ```bash
    python manage.py migrate
    ```

6.  **Create a superuser:**
    Follow the prompts to create an administrator account for accessing the Django admin panel.
    ```bash
    python manage.py createsuperuser
    ```

7.  **Run the backend server:**
    ```bash
    python manage.py runserver
    ```
    The backend API will be available at `http://127.0.0.1:8000`.

### Frontend Setup

1.  **Open a new terminal** and navigate to the project root.

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the project root by copying the example.
    ```bash
    cp .env.example .env
    ```
    The default configuration points to the local backend and has API mocking disabled.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:5173`. You can now log in with the superuser you created.

### Running with API Mocking

To run the frontend without a live backend, enable API mocking:
1.  Open the `.env` file in the project root.
2.  Change `VITE_API_MOCKING` to `enabled`:
    ```
    VITE_API_MOCKING=enabled
    ```
3.  Restart the Vite development server (`npm run dev`). The application will now use the mock API handlers defined in `src/mocks/handlers.ts`.

### Available Scripts

-   `npm run dev`: Starts the Vite development server with Hot Module Replacement.
-   `npm run build`: Compiles and bundles the application for production in the `dist` directory.
-   `npm run lint`: Lints the codebase using ESLint to check for errors and style issues.
-   `npm run preview`: Serves the production build locally to preview it.
-   `npm run test`: Runs the unit tests using Vitest.
