# Researcher Web Application

This is a Researcher App that manages tasks, deadlines, collaborators, and has a multi-folder system regarding various academia events.

## To run with with docker

```
  docker-compose up --build
```

## To run the app without docker

### React Frontend:

Go to the project's root directory (research-dashboard/) and install the required dependencies with:

```
  cd research-dashboard/frontend
  npm install
  npm start
```

### FastAPI Backend:
Go to project's api directory (research-dashboard/backend/) and create virtual environment

For mac/unix users: ```python3 -m venv <env>```
For windows users: ```py -m venv <env>```

After creating the environment, activate it by running

For mac/unix users: ```source <env>/bin/activate```
For windows users: ```.\<env>\Scripts\activate```

Then install the required packages mentioned in the requirements.txt file:

```pip install -r research-dashboard/backend/requirements.txt```

Run the backend with:

```
  uvicorn main:app --reload
```

Run the command below to allow access to the single chosen google drive account. The google credentials should be stored in the database.

```
  python initial_auth.py
```
