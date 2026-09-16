import React from 'react';

const Profile: React.FC = () => {
    return (
        <div>
            <h1>Supplier Profile</h1>
            <form>
                <div>
                    <label htmlFor="name">Name:</label>
                    <input type="text" id="name" name="name" />
                </div>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" />
                </div>
                <div>
                    <label htmlFor="phone">Phone:</label>
                    <input type="tel" id="phone" name="phone" />
                </div>
                <div>
                    <label htmlFor="company">Company:</label>
                    <input type="text" id="company" name="company" />
                </div>
                <button type="submit">Update Profile</button>
            </form>
        </div>
    );
};

export default Profile;