import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../services/api';
import { type Task, TaskStatus } from '../types/task';
import './TaskDetailPage.css';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchTask = useCallback(async () => {
    if (!id) return;

    try {
      const data = await taskService.getTask(id);
      setTask(data);
      setError('');
    } catch (err) {
      setError('Failed to load task details');
      console.error('Error fetching task:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    // Auto-refresh every 3 seconds if task is not completed or failed
    if (!task || (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.PROCESSING)) {
      return;
    }

    const interval = setInterval(() => {
      fetchTask();
    }, 3000);

    return () => clearInterval(interval);
  }, [task, fetchTask]);

  const getStatusClass = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'status-completed';
      case TaskStatus.PROCESSING:
        return 'status-processing';
      case TaskStatus.PENDING:
        return 'status-pending';
      case TaskStatus.FAILED:
        return 'status-failed';
      default:
        return '';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="task-detail-page">
        <div className="loading">Loading task details...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="task-detail-page">
        <div className="container">
          <div className="error-message">{error || 'Task not found'}</div>
          <button onClick={() => navigate('/tasks')} className="back-button">
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-detail-page">
      <div className="container">
        <div className="header">
          <button onClick={() => navigate('/tasks')} className="back-button">
            ← Back to Tasks
          </button>
          <span className={`status-badge ${getStatusClass(task.status)}`}>
            {getStatusText(task.status)}
          </span>
        </div>

        <div className="task-detail">
          <div className="section">
            <h2>User Input</h2>
            <div className="content-box">
              {task.userInput}
            </div>
          </div>

          {task.status === TaskStatus.PENDING && (
            <div className="status-message pending">
              <div className="spinner"></div>
              <p>Task is waiting to be processed...</p>
            </div>
          )}

          {task.status === TaskStatus.PROCESSING && (
            <div className="status-message processing">
              <div className="spinner"></div>
              <p>AI is processing your request...</p>
            </div>
          )}

          {task.status === TaskStatus.COMPLETED && task.aiResult && (
            <div className="section">
              <h2>AI Result</h2>
              <div className="content-box result-box">
                {task.aiResult}
              </div>
            </div>
          )}

          {task.status === TaskStatus.FAILED && (
            <div className="section">
              <h2>Error</h2>
              <div className="content-box error-box">
                {task.error || 'An unknown error occurred'}
              </div>
            </div>
          )}

          <div className="metadata">
            <div className="meta-item">
              <span className="meta-label">Created:</span>
              <span>{new Date(task.createdAt).toLocaleString()}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Updated:</span>
              <span>{new Date(task.updatedAt).toLocaleString()}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Task ID:</span>
              <span className="task-id">{task.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
