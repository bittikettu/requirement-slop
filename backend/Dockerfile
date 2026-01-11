# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code into the container
COPY . ./backend

# Create a directory for the database
RUN mkdir -p /app/db

# Expose port 8000 for the FastAPI app
EXPOSE 8000

# Run uvicorn when the container launches, treating 'backend' as a package
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
