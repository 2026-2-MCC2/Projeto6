import React from 'react';
import SupplierDashboard from '../components/Supplier/Dashboard';
import SupplierEvents from '../components/Supplier/Events';
import CreateProposal from '../components/Supplier/CreateProposal';
import SupplierProfile from '../components/Supplier/Profile';
import Chat from '../components/Chat/Chat';
import Contact from '../components/Contact/Contact';

const SupplierPage: React.FC = () => {
    return (
        <div>
            <h1>Supplier Interface</h1>
            <SupplierDashboard />
            <SupplierEvents />
            <CreateProposal />
            <SupplierProfile />
            <Chat />
            <Contact />
        </div>
    );
};

export default SupplierPage;