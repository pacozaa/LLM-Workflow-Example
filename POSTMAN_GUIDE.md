# Postman Collection Guide

This guide explains how to use the Postman collection to test the LLM Workflow Backend API.

## Overview

The `LLM-Workflow-Backend.postman_collection.json` file contains a comprehensive set of API tests for the backend service. It includes tests for all endpoints, validation tests, and edge case scenarios.

## Prerequisites

1. **Postman** installed on your machine
   - Download from: https://www.postman.com/downloads/
   
2. **Backend service running**
   - The backend must be running on `http://localhost:3001`
   - Follow the instructions in the main README.md to start the backend
   
3. **Required services**
   - PostgreSQL database running (via docker-compose)
   - Azure Service Bus configured (for task processing)
   - OpenAI API key configured (for AI processing)

## Importing the Collection

1. Open Postman
2. Click **Import** button in the top-left corner
3. Select **File** tab
4. Choose `LLM-Workflow-Backend.postman_collection.json`
5. Click **Import**

The collection will appear in your Collections sidebar as "LLM Workflow Backend API".

## Collection Structure

The collection includes the following requests:

### Core API Endpoints

1. **Health Check** (`GET /`)
   - Verifies the backend service is running
   - Returns a simple status message

2. **Create Task** (`POST /tasks`)
   - Creates a new task with user input
   - Automatically saves the task ID for subsequent requests
   - Includes validation tests

3. **Get All Tasks** (`GET /tasks`)
   - Retrieves all tasks from the database
   - Returns an array of task objects

4. **Get Task by ID** (`GET /tasks/:id`)
   - Retrieves a specific task using its UUID
   - Uses the task ID from the "Create Task" request

### Validation Tests

5. **Create Task - Invalid Input (Empty)**
   - Tests validation for empty input
   - Should return 400 Bad Request

6. **Create Task - Missing Field**
   - Tests validation for missing required field
   - Should return 400 Bad Request

7. **Get Task by ID - Invalid UUID**
   - Tests error handling for invalid UUID format
   - Should return 404 or 500 error

8. **Create Task - Long Input**
   - Tests the API with a longer text input
   - Ensures proper handling of substantial content

## Running the Tests

### Run Individual Request

1. Select any request from the collection
2. Click the **Send** button
3. View the response in the Response panel
4. Check the **Test Results** tab to see if tests passed

### Run Entire Collection

1. Click the **three dots** (...) next to the collection name
2. Select **Run collection**
3. Click **Run LLM Workflow Backend API**
4. View the test results summary

### Recommended Test Order

For the best experience, run the requests in this order:

1. **Health Check** - Verify backend is running
2. **Create Task** - Create a task and save its ID
3. **Get Task by ID** - Retrieve the created task
4. **Get All Tasks** - View all tasks
5. Run validation tests as needed

## Collection Variables

The collection uses the following variables:

- **baseUrl**: Backend API base URL (default: `http://localhost:3001`)
- **taskId**: Automatically populated when creating a task
- **taskInput**: Sample input text for task creation

### Modifying Variables

1. Click on the collection name
2. Select the **Variables** tab
3. Update the **Current value** as needed
4. Click **Save**

## Test Scripts

Each request includes test scripts that automatically validate:

- Response status codes
- Response data structure
- Required fields presence
- Data types and formats
- Business logic validation

### Example Test Results

✅ **Status code is 200**
✅ **Response has task properties**
✅ **Task has correct userInput**
✅ **Task status is pending**

## Customizing Requests

### Changing the User Input

Edit the request body in the **Create Task** request:

```json
{
  "userInput": "Your custom input text here"
}
```

### Using Different Environment

If your backend runs on a different port or host:

1. Go to Collection Variables
2. Update `baseUrl` to your backend URL
3. Save the changes

Example: `http://localhost:8080` or `https://api.example.com`

## Troubleshooting

### Connection Refused

**Problem**: Cannot connect to backend
**Solution**: 
- Ensure backend is running: `cd apps/backend && npm run dev`
- Check the port in collection variables matches your backend port

### 500 Internal Server Error

**Problem**: Server error when creating tasks
**Solution**:
- Verify PostgreSQL is running: `docker-compose ps`
- Check Azure Service Bus configuration in backend `.env`
- Review backend logs for error details

### 404 Not Found

**Problem**: Task not found by ID
**Solution**:
- Ensure you run "Create Task" before "Get Task by ID"
- The task ID is automatically saved from the creation response
- Check if the task ID variable is set in Collection Variables

### Validation Errors (400)

**Problem**: Bad Request errors
**Solution**:
- Ensure `userInput` field is not empty
- Check that required fields are included in request body
- Verify JSON format is valid

## Task Status Flow

When you create a task, it goes through the following statuses:

1. **pending** - Task created, waiting for processing
2. **processing** - Task is being processed by OpenAI service
3. **completed** - Task successfully processed, AI result available
4. **failed** - Task processing failed, error message available

Use "Get Task by ID" to poll for status updates.

## API Response Examples

### Successful Task Creation

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userInput": "Explain quantum computing",
  "status": "pending",
  "aiResult": null,
  "error": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Completed Task

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userInput": "Explain quantum computing",
  "status": "completed",
  "aiResult": "Quantum computing is a revolutionary computing paradigm...",
  "error": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:31:30.000Z"
}
```

## Additional Resources

- Main Project README: [README.md](./README.md)
- API Documentation: Check the backend controller files in `apps/backend/src/`
- Backend Source: `apps/backend/src/tasks/tasks.controller.ts`

## Support

If you encounter issues with the Postman collection:

1. Verify all prerequisites are met
2. Check backend logs for errors
3. Ensure all environment variables are configured
4. Try running requests individually before running the entire collection

## Contributing

To update this collection:

1. Make changes in Postman
2. Export the collection (Collection > Export > Collection v2.1)
3. Save as `LLM-Workflow-Backend.postman_collection.json`
4. Update this guide if adding new requests
