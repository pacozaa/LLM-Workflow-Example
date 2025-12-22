# Quick Start Guide

This guide will help you get the AI Task Workflow system up and running quickly.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 20.x or higher ([download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)
- **Docker Desktop** ([download](https://www.docker.com/products/docker-desktop))
- **OpenAI API Key** ([get one here](https://platform.openai.com/api-keys))

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install all dependencies for both frontend and backend
npm install
```

This will install dependencies for the entire monorepo workspace.

### 2. Start Infrastructure

Start PostgreSQL using Docker Compose:

```bash
docker-compose up -d
```

Verify the service is running:
```bash
docker-compose ps
```

You should see `llm-workflow-postgres` running.

### 3. Configure Backend

Create environment file:
```bash
cd apps/backend
cp .env.example .env
```

Edit `apps/backend/.env` and add your OpenAI API key and Azure Service Bus connection string:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://your-namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=your-key
AZURE_SERVICE_BUS_QUEUE_NAME=ai-tasks
```

**Important:** Keep the other settings as-is for local development. You'll need an Azure Service Bus namespace with a queue named `ai-tasks`.

### 4. Configure Frontend (Optional)

The frontend works with default settings for local development. If needed:

```bash
cd apps/frontend
cp .env.example .env
```

### 5. Start the Application

From the root directory, start both frontend and backend:

```bash
npm run dev
```

Or start them individually in separate terminals:

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
```

### 6. Access the Application

Once both services are running:

- **Frontend**: Open http://localhost:5173 in your browser
- **Backend API**: http://localhost:3001

## First Task Test

1. Navigate to http://localhost:5173
2. Enter a question like "What is the capital of France?"
3. Click **Submit Task**
4. You'll be redirected to the task list
5. Watch the status change from **PENDING** → **PROCESSING** → **COMPLETED**
6. Click on the task to see the AI response

## Troubleshooting

### "OpenAI API key is required" Error

**Cause:** Backend started without OPENAI_API_KEY configured.

**Solution:**
1. Stop the backend (Ctrl+C)
2. Edit `apps/backend/.env` and set your API key
3. Restart the backend: `cd apps/backend && npm run dev`

### "Cannot connect to database" Error

**Cause:** PostgreSQL is not running or not accessible.

**Solution:**
```bash
# Check if PostgreSQL container is running
docker-compose ps

# If not running, start it
docker-compose up -d postgres

# Check logs for errors
docker-compose logs postgres
```

### "Connection failed to Azure Service Bus" Error

**Cause:** Azure Service Bus connection string is invalid or queue doesn't exist.

**Solution:**
1. Verify your Azure Service Bus connection string is correct in `apps/backend/.env`
2. Check that the queue exists in your Service Bus namespace (default name: `ai-tasks`)
3. Ensure your Service Bus namespace is accessible
4. Check backend logs for specific error messages

### Frontend "Network Error" or Cannot Connect

**Cause:** Backend is not running or CORS issue.

**Solution:**
1. Ensure backend is running on port 3001
2. Check backend terminal for errors
3. Verify `FRONTEND_URL` in backend `.env` matches your frontend URL

### Tasks Stuck in PENDING Status

**Cause:** Azure Service Bus consumer is not running or OpenAI API issue.

**Solution:**
1. Check backend logs for errors
2. Verify OpenAI API key is valid
3. Verify Azure Service Bus connection string is correct
4. Check that the queue exists in Azure Service Bus
5. Restart the backend to restart the consumer

## Development Tips

### View Database Contents

```bash
# Connect to PostgreSQL
docker exec -it llm-workflow-postgres psql -U postgres -d llm_workflow

# List all tasks
SELECT id, status, created_at FROM tasks ORDER BY created_at DESC;

# Exit
\q
```

### Monitor Azure Service Bus

1. Open [Azure Portal](https://portal.azure.com)
2. Navigate to your Service Bus namespace
3. Go to **Queues** section
4. Click on your queue (e.g., `ai-tasks`) to see messages and metrics

### Clear All Data

```bash
# Stop services
docker-compose down

# Remove volumes (deletes all data)
docker-compose down -v

# Restart
docker-compose up -d
```

### Hot Reload

Both frontend and backend support hot reload:
- **Frontend**: Edit files in `apps/frontend/src/` - changes appear immediately
- **Backend**: Edit files in `apps/backend/src/` - server restarts automatically

## Next Steps

- Read [README.md](README.md) for complete documentation
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design details
- Explore the code in `apps/backend/src/` and `apps/frontend/src/`
- Customize the OpenAI prompt in `apps/backend/src/openai/openai.service.ts`
- Add more features like task cancellation, user authentication, etc.

## Stop the Application

Press `Ctrl+C` in the terminal(s) running the application.

To stop infrastructure:
```bash
docker-compose down
```

To stop and remove all data:
```bash
docker-compose down -v
```

## Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review application logs in the terminal
3. Check Docker logs: `docker-compose logs`
4. Review the README.md and ARCHITECTURE.md files
