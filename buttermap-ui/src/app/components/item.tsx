import React from 'react';

interface SectionProps {
    children: React.ReactNode;
}

const Item: React.FC<SectionProps> = ({children}) => {
    return (
        <div className="mb-4 mt-4 p-1">
            {children}
        </div>
    );
};

export default Item;
