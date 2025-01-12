import React from 'react';

interface NotificationCounterProps {
    count: number;
}

const NotificationCounter: React.FC<NotificationCounterProps> = ({ count }) => {
    return (
        <div className="inline-flex justify-center items-center self-center">
            {count > 0 && (
                <div
                    className="ml-4 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center self-center">
                    <span className="material-icons">{count > 99 ? "99+" : count}</span>

                </div>
            )}
        </div>
    );
};

export default NotificationCounter;