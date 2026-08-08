import { useState } from 'react';
import { Wrench } from 'lucide-react';

// This component accepts 'vehicleId' so it knows exactly which truck the task belongs to
function TaskForm({ vehicleId }) {
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, description }) // Sends the linked ID and the job
      });
      
      if (response.ok) {
        setDescription(''); // Clears the input field
        setMessage('Task assigned to mechanic!');
        setTimeout(() => setMessage(''), 3000); // Makes the success message vanish after 3 seconds
      }
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
      />
      <button type="submit" style={{ padding: '8px', border: 'none', borderRadius: '4px', backgroundColor: '#007bff', color: 'white', fontSize: '14px', cursor: 'pointer' }}>
        Assign
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default TaskForm;