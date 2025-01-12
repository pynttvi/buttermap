import React, { useEffect, useState, useMemo } from "react";

interface TextSliderProps<T> {
    items: { name: string; value: T; [key: string]: any }[]; // Array of items with name, value, and optional properties
    value?: T; // Current value to set externally
    onTransition?: (currentIndex: number, newItem: { name: string; value: T }) => void; // Callback when transitioning
    sortKey?: string; // Optional key to sort items
}

const TextSlider = <T,>({ items, value, onTransition, sortKey }: TextSliderProps<T>) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Sort items if `sortKey` is provided
    const sortedItems = useMemo(() => {
        if (!sortKey) return items;
        return [...items].sort((a, b) => {
            const keyA = a[sortKey];
            const keyB = b[sortKey];
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        });
    }, [items, sortKey]);

    // Sync state with external `value` prop
    useEffect(() => {
        if (value !== undefined) {
            const index = sortedItems.findIndex((item) => item.value === value);
            if (index !== -1 && index !== currentIndex) {
                setCurrentIndex(index);
            }
        }
    }, [value, sortedItems, currentIndex]); // Add `currentIndex` to prevent unnecessary updates

    // Handlers for next and previous actions
    const handleNext = () => {
        const newIndex = (currentIndex + 1) % sortedItems.length;
        setCurrentIndex(newIndex);
        onTransition?.(newIndex, sortedItems[newIndex]); // Call the onTransition callback
    };

    const handlePrevious = () => {
        const newIndex = (currentIndex - 1 + sortedItems.length) % sortedItems.length;
        setCurrentIndex(newIndex);
        onTransition?.(newIndex, sortedItems[newIndex]); // Call the onTransition callback
    };

    return (
        <div className="text-slider flex flex-col items-center p-4 bg-gray-800 text-white rounded shadow-md">
            <div className="flex items-center justify-between w-full">
                {/* Previous Button */}
                <button
                    onClick={handlePrevious}
                    className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
                >
                    <span className="text-2xl">{"<"}</span> {/* Left arrow */}
                </button>

                {/* Display the name of the current item */}
                <div className="text-center text-lg font-medium mx-4">{sortedItems[currentIndex].name}</div>

                {/* Next Button */}
                <button
                    onClick={handleNext}
                    className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
                >
                    <span className="text-2xl">{">"}</span> {/* Right arrow */}
                </button>
            </div>
        </div>
    );
};

export default TextSlider;
