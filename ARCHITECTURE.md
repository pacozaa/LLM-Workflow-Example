# AI Task Workflow Architecture

## System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                              │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Submit Task (Input Page - http://localhost:5173)            │
│   - User enters text input                                          │
│   - POST request to /tasks                                          │
│   - Navigates to Task List                                          │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Backend API (NestJS - Port 3001)                            │
│   TasksController.create()                                          │
│     ├─► Create Task in PostgreSQL (status: PENDING)                 │
│     └─► Publish message to Azure Service Bus queue                  │
│                                                                      │
│   Returns: Task object with ID and PENDING status                   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
    ┌──────────────────────────┐   ┌──────────────────────────┐
    │   PostgreSQL             │   │   Azure Service Bus      │
    │   (Port 5432)            │   │                          │
    │                          │   │                          │
    │   tasks table:           │   │   ai-tasks queue:        │
    │   - id (uuid)            │   │   - taskId               │
    │   - userInput            │   │   - userInput            │
    │   - status: PENDING      │   │                          │
    │   - aiResult: null       │   └──────────────────────────┘
    │   - createdAt            │              │
    │   - updatedAt            │              │
    └──────────────────────────┘              ▼
                   ▲             ┌──────────────────────────┐
                   │             │   Message Consumer        │
                   │             │   TaskConsumerService     │
                   │             │                          │
                   │             │   1. Consume message     │
                   │             │   2. Update status:      │
                   │             │      PROCESSING          │
                   └─────────────┤   3. Call OpenAI API     │
                                 │   4. Update task:        │
                                 │      - status: COMPLETED │
                                 │      - aiResult: text    │
                                 └──────────────────────────┘
                                             │
                                             ▼
                                 ┌──────────────────────────┐
                                 │   OpenAI API             │
                                 │   gpt-3.5-turbo          │
                                 │                          │
                                 │   Processes user input   │
                                 │   Returns AI response    │
                                 └──────────────────────────┘
                   
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Frontend Polling (Auto-refresh every 3 seconds)             │
│                                                                      │
│   Task List Page (/tasks)                                           │
│     - GET /tasks → Display all tasks with status                    │
│     - Shows: PENDING, PROCESSING, COMPLETED, FAILED                 │
│                                                                      │
│   Task Detail Page (/tasks/:id)                                     │
│     - GET /tasks/:id → Display task details                         │
│     - Auto-refreshes until status is COMPLETED or FAILED            │
│     - Shows AI result when completed                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 19**: UI framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Vite**: Build tool and dev server

### Backend
- **NestJS 11**: Node.js framework
- **TypeORM**: ORM for PostgreSQL
- **@azure/service-bus**: Azure Service Bus client
- **OpenAI SDK**: AI processing
- **class-validator**: Input validation

### Infrastructure
- **PostgreSQL 16**: Relational database
- **Azure Service Bus**: Message queue
- **Docker Compose**: Container orchestration (local development)

## API Endpoints

### POST /tasks
Create a new task
```json
Request:
{
  "userInput": "Your question here"
}

Response:
{
  "id": "uuid",
  "userInput": "Your question here",
  "status": "pending",
  "aiResult": null,
  "error": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /tasks
List all tasks (ordered by creation date, newest first)
```json
Response:
[
  {
    "id": "uuid",
    "userInput": "Question...",
    "status": "completed",
    "aiResult": "AI response...",
    "error": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /tasks/:id
Get task details by ID
```json
Response:
{
  "id": "uuid",
  "userInput": "Question...",
  "status": "completed",
  "aiResult": "AI response...",
  "error": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Task Status Flow

```
PENDING → PROCESSING → COMPLETED
                    ↘ FAILED
```

1. **PENDING**: Task created, waiting in queue
2. **PROCESSING**: Consumer picked up task, calling OpenAI
3. **COMPLETED**: AI processing successful, result saved
4. **FAILED**: Error occurred during processing

## File Structure

```
LLM-Workflow-Example/
├── apps/
│   ├── backend/
│   │   └── src/
│   │       ├── config/           # Configuration files
│   │       │   ├── database.config.ts
│   │       │   ├── servicebus.config.ts
│   │       │   └── openai.config.ts
│   │       ├── tasks/            # Task management
│   │       │   ├── entities/     # TypeORM entities
│   │       │   ├── dto/          # Data transfer objects
│   │       │   ├── tasks.controller.ts
│   │       │   ├── tasks.service.ts
│   │       │   └── tasks.module.ts
│   │       ├── servicebus/       # Azure Service Bus
│   │       │   ├── servicebus.service.ts (publisher)
│   │       │   ├── task-consumer.service.ts (subscriber)
│   │       │   └── servicebus.module.ts
│   │       ├── openai/           # AI service
│   │       │   ├── openai.service.ts
│   │       │   └── openai.module.ts
│   │       ├── app.module.ts     # Main application module
│   │       └── main.ts           # Entry point
│   └── frontend/
│       └── src/
│           ├── pages/            # React pages
│           │   ├── InputPage.tsx
│           │   ├── TaskListPage.tsx
│           │   └── TaskDetailPage.tsx
│           ├── services/         # API client
│           │   └── api.ts
│           ├── types/            # TypeScript types
│           │   └── task.ts
│           └── App.tsx           # Router setup
└── docker-compose.yml            # Infrastructure services
```

## Development Workflow

**Local Development:**
1. Start infrastructure: `docker-compose up -d`
2. Configure backend `.env` with Azure Service Bus connection string and OpenAI API key
3. Start backend: `cd apps/backend && npm run dev`
4. Start frontend: `cd apps/frontend && npm run dev`
5. Open browser: http://localhost:5173

**Azure Deployment:**
See `docs/deployment/` for Azure deployment instructions.

## Key Features

✅ Asynchronous task processing with Azure Service Bus
✅ Real-time status updates with auto-refresh
✅ Clean separation of concerns (publisher/consumer pattern)
✅ Type-safe with TypeScript
✅ Database persistence with PostgreSQL
✅ Modern React with hooks
✅ Responsive UI with loading states
✅ Error handling and retry logic
✅ RESTful API design
✅ Modular and maintainable code structure
