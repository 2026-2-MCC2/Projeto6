import React from 'react';

const Events: React.FC = () => {
    // Sample data for active events
    const activeEvents = [
        { id: 1, name: 'Music Festival', date: '2023-11-01', location: 'Central Park' },
        { id: 2, name: 'Art Exhibition', date: '2023-11-15', location: 'Art Gallery' },
        { id: 3, name: 'Tech Conference', date: '2023-12-05', location: 'Convention Center' },
    ];

    return (
        <div>
            <h1>Active Events</h1>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody>
                    {activeEvents.map(event => (
                        <tr key={event.id}>
                            <td>{event.id}</td>
                            <td>{event.name}</td>
                            <td>{event.date}</td>
                            <td>{event.location}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Events;