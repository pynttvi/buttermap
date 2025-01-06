import React from 'react';

interface SectionProps {
    children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({children}) => {
    return (
        <div className="mb-4 mb-4 p-1">
            {children}
        </div>
    );
};

export default Section;
