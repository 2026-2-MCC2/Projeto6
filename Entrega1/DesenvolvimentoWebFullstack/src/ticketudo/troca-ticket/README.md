# Troca Ticket

Troca Ticket is a comprehensive platform designed to facilitate event management and ticketing for administrators, suppliers, and organizers. This project aims to streamline the process of event creation, service provision, and user management.

## Project Structure

```
troca-ticket
├── public
│   └── index.html
├── src
│   ├── components
│   │   ├── Admin
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Complaints.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Registration.tsx
│   │   │   └── RegistrationRequests.tsx
│   │   ├── Supplier
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── CreateProposal.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Registration.tsx
│   │   ├── Organizer
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CreateEvent.tsx
│   │   │   ├── ManageTickets.tsx
│   │   │   ├── Suppliers.tsx
│   │   │   ├── ManageSuppliers.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Registration.tsx
│   │   ├── Chat
│   │   │   └── Chat.tsx
│   │   └── Contact
│   │       └── Contact.tsx
│   ├── pages
│   │   ├── AdminPage.tsx
│   │   ├── SupplierPage.tsx
│   │   ├── OrganizerPage.tsx
│   │   └── ContactPage.tsx
│   ├── App.tsx
│   ├── index.tsx
│   └── styles
│       └── global.css
├── package.json
├── tsconfig.json
└── README.md
```

## Features

- **Administrator Interface**: 
  - Login and registration
  - Home dashboard
  - View active events
  - Manage complaints
  - Accept registration requests from suppliers and organizers

- **Supplier Interface**: 
  - Login and registration
  - View events they provide services for
  - Create proposals for organizers
  - View events needing services
  - Manage profile

- **Organizer Interface**: 
  - Login and registration
  - View active events
  - Create events and tickets
  - Manage suppliers
  - View suppliers for specific requests

- **Chat Feature**: Integrated chat for all interfaces to facilitate communication.

- **Contact Screen**: A dedicated screen for users to reach out for support or inquiries.

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd troca-ticket
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm start
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.