import React from 'react';

const Chat: React.FC = () => {
    return (
        <div>
            <h2>Chat Feature</h2>
            <div className="chat-window">
                {/* Chat messages will be displayed here */}
            </div>
            <input type="text" placeholder="Type your message..." />
            <button>Send</button>
        </div>
    );
};

export default Chat;