import React, {useEffect, useState} from "react";

export interface AccordionItem {
    title: string | React.ReactNode;
    content: string | React.ReactNode;
}

interface AccordionProps {
    items: Array<AccordionItem | undefined>;
    defaultStyles?: boolean,
    defaultOpenIndex?: number
}

const defaultColors = "bg-gray-900 text-gray-300"
const Accordion: React.FC<AccordionProps> = ({items, defaultStyles, defaultOpenIndex}) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => {
        if (defaultOpenIndex !== null && defaultOpenIndex !== undefined) {
            setOpenIndex(defaultOpenIndex)
        }
    }, [defaultOpenIndex])

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="w-full space-y-2">
            {items
                .filter((ai) => ai !== undefined && ai !== null)
                .map((item, index) => (
                    <div key={index} className="border border-gray-700 rounded w-full">
                        {/* Header */}
                        <button
                            onClick={() => toggleAccordion(index)}
                            className="w-full px-4 py-2 text-left bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring focus:ring-blue-500 flex justify-between items-center"
                        >
                            <span>{item.title}</span>
                            <span className="ml-2">
                            {openIndex === index ? "−" : "+"}
                        </span>
                        </button>
                        {/* Content */}
                        {openIndex === index && (
                            <div className={`px-4 py-2 ${defaultStyles ? defaultColors : ""}`}>
                                {item.content}
                            </div>
                        )}
                    </div>
                ))}
        </div>
    );
};

export default Accordion;
