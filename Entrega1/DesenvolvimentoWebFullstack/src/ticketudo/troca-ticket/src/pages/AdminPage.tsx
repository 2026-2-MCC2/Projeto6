import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Dashboard from '../components/Admin/Dashboard';
import Events from '../components/Admin/Events';
import Complaints from '../components/Admin/Complaints';
import Login from '../components/Admin/Login';
import Registration from '../components/Admin/Registration';
import RegistrationRequests from '../components/Admin/RegistrationRequests';
import Chat from '../components/Chat/Chat';
import Contact from '../components/Contact/Contact';

const AdminPage: React.FC = () => {
    return (
        <Router>
            <div>
                <Switch>
                    <Route path="/admin/dashboard" component={Dashboard} />
                    <Route path="/admin/events" component={Events} />
                    <Route path="/admin/complaints" component={Complaints} />
                    <Route path="/admin/login" component={Login} />
                    <Route path="/admin/registration" component={Registration} />
                    <Route path="/admin/registration-requests" component={RegistrationRequests} />
                    <Route path="/admin/chat" component={Chat} />
                    <Route path="/admin/contact" component={Contact} />
                </Switch>
            </div>
        </Router>
    );
};

export default AdminPage;