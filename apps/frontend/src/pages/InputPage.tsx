import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../services/api';
import './InputPage.css';

export default function InputPage() {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await taskService.createTask(userInput);
      // Navigate to task list after successful submission
      navigate('/tasks');
    } catch (err) {
      setError('Failed to submit task. Please try again.');
      console.error('Error submitting task:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="input-page">
      <div className="container">
        <h1>AI Task Workflow</h1>
        <p className="subtitle">Enter your text to process with AI</p>
        
        <form onSubmit={handleSubmit} className="input-form">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter your question or text here..."
            rows={6}
            disabled={loading}
            className="input-textarea"
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            disabled={loading || !userInput.trim()}
            className="submit-button"
          >
            {loading ? 'Submitting...' : 'Submit Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
