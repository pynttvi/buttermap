import React from 'react';

interface SectionProps {
    children: React.ReactNode;
}

const FlexItem: React.FC<SectionProps> = ({children}) => {
    return (
        <div className="flex flex-wrap self-center justify-center gap-2 w-full mb-4 mt-4 p-1">
            {children}
        </div>
    );
};

export default FlexItem;
