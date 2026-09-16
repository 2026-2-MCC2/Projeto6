import React, { useState } from 'react';

const CreateEvent: React.FC = () => {
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventDescription, setEventDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic to handle event creation
        console.log('Event Created:', { eventName, eventDate, eventDescription });
    };

    return (
        <div>
            <h1>Create Event</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Event Name:</label>
                    <input 
                        type="text" 
                        value={eventName} 
                        onChange={(e) => setEventName(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Event Date:</label>
                    <input 
                        type="date" 
                        value={eventDate} 
                        onChange={(e) => setEventDate(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Event Description:</label>
                    <textarea 
                        value={eventDescription} 
                        onChange={(e) => setEventDescription(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit">Create Event</button>
            </form>
        </div>
    );
};

export default CreateEvent;