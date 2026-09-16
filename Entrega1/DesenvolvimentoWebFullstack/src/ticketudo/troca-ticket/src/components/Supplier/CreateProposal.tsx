import React, { useState } from 'react';

const CreateProposal: React.FC = () => {
    const [eventId, setEventId] = useState('');
    const [serviceDetails, setServiceDetails] = useState('');
    const [price, setPrice] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic to handle proposal submission
        console.log('Proposal submitted:', { eventId, serviceDetails, price });
    };

    return (
        <div>
            <h2>Create Proposal</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="eventId">Event ID:</label>
                    <input
                        type="text"
                        id="eventId"
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="serviceDetails">Service Details:</label>
                    <textarea
                        id="serviceDetails"
                        value={serviceDetails}
                        onChange={(e) => setServiceDetails(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="price">Price:</label>
                    <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Submit Proposal</button>
            </form>
        </div>
    );
};

export default CreateProposal;