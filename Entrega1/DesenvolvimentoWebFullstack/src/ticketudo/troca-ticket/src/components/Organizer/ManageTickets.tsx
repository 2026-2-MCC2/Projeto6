import React, { useState } from 'react';

const ManageTickets: React.FC = () => {
    const [tickets, setTickets] = useState([]);
    const [ticketName, setTicketName] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');

    const handleAddTicket = () => {
        if (ticketName && ticketPrice) {
            setTickets([...tickets, { name: ticketName, price: ticketPrice }]);
            setTicketName('');
            setTicketPrice('');
        }
    };

    return (
        <div>
            <h1>Manage Tickets</h1>
            <div>
                <input
                    type="text"
                    placeholder="Ticket Name"
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Ticket Price"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                />
                <button onClick={handleAddTicket}>Add Ticket</button>
            </div>
            <h2>Current Tickets</h2>
            <ul>
                {tickets.map((ticket, index) => (
                    <li key={index}>
                        {ticket.name} - ${ticket.price}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ManageTickets;