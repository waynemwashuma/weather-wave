# Application Workflow Tracker

This project has two parts:

- A Django backend that stores and serves application data
- A React frontend that lets you create, review, and update applications

## User guide

If you want to understand how the website works before running it, start with the [User Guide](user-guide.md). It explains the user flow and the reviewer flow step by step.

There is also a [live version](https://waynemwashuma.github.io/applicant/) of the frontend on this repository's GitHub Pages site, and it uses mock data so you can explore the app without running the backend locally.

## What You Need

- A computer with `Node.js` and `npm` installed
- Python 3.12 for the backend
- A web browser such as Chrome, Edge, Firefox, or Safari
- The backend has its own setup steps available in [backend/README.md](backend/README.md).

## Start Here

1. Open a terminal.
2. Go to this project folder.
3. Set up the backend by following [backend/README.md](backend/README.md).
4. Install the JavaScript dependencies:

```bash
npm install
```

5. Start both the backend and frontend together:

```bash
npm start
```

6. Wait for both servers to finish starting.
7. Open the app in your browser:

- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:8000`

## If You Want To Run Only One Part

Start only the frontend:

```bash
npm run start:frontend
```

Start only the backend:

```bash
npm run start:backend
```

## Project Layout

- `backend/` contains the Django project and API
- `frontend/` contains the React app
- `package.json` contains the root commands for running both together

## Useful Reads

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [User Guide](user-guide.md)

## Common Problems

- If `npm start` fails because the backend cannot find a Python interpreter, check that the backend virtual environment exists and that you completed the steps in `backend/README.md`.
- If port `5173` or `8000` is already in use, close the other program using that port and try again.
- If the browser shows old data, clear the site data or do a hard refresh.

## Contact details

name: Wayne Mwashuma
email: <mwashumawayne@gmail.com>
