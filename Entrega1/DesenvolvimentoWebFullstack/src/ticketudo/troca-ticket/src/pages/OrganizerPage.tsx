import React from 'react';
import Dashboard from '../components/Organizer/Dashboard';
import CreateEvent from '../components/Organizer/CreateEvent';
import ManageTickets from '../components/Organizer/ManageTickets';
import Suppliers from '../components/Organizer/Suppliers';
import ManageSuppliers from '../components/Organizer/ManageSuppliers';
import Chat from '../components/Chat/Chat';
import Contact from '../components/Contact/Contact';

const OrganizerPage = () => {
    return (
        <div>
            <h1>Organizer Dashboard</h1>
            <Dashboard />
            <CreateEvent />
            <ManageTickets />
            <Suppliers />
            <ManageSuppliers />
            <Chat />
            <Contact />
        </div>
    );
};

export default OrganizerPage;