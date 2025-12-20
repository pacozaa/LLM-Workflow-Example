import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../services/api';
import { type Task, TaskStatus } from '../types/task';
import './TaskListPage.css';

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const data = await taskService.getAllTasks();
      setTasks(data);
      setError('');
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // Auto-refresh every 3 seconds to check for updates
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="task-list-page">
        <div className="loading">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="task-list-page">
      <div className="container">
        <div className="header">
          <h1>Task List</h1>
          <button onClick={() => navigate('/')} className="new-task-button">
            + New Task
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks yet. Create your first task!</p>
            <button onClick={() => navigate('/')} className="create-first-button">
              Create Task
            </button>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="task-item"
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <div className="task-content">
                  <div className="task-input">
                    {task.userInput.length > 100
                      ? `${task.userInput.substring(0, 100)}...`
                      : task.userInput}
                  </div>
                  <div className="task-meta">
                    <span className={`status-badge ${getStatusClass(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                    <span className="task-date">
                      {new Date(task.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
