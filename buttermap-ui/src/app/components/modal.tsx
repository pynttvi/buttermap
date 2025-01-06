import React, {FC} from 'react';

interface ModalProps {
    isOpen: boolean;
    onAccept?: () => void;
    onCancel: () => void;
    title?: string;
    acceptButtonText?: string;
    children: React.ReactNode;
}

const Modal: FC<ModalProps> = ({isOpen, onAccept, onCancel, title, acceptButtonText, children}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-black rounded-lg shadow-lg w-full max-w-lg h-screen mx-4 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">{title || 'Modal Title'}</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label="Close Modal"
                    >
                        &times;
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 p-4 overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-gray-200">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring focus:ring-blue-300"
                    >
                        Close
                    </button>
                    {onAccept && (
                        <button
                            onClick={onAccept}
                            className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring focus:ring-blue-300"
                        >
                            {acceptButtonText ?? "Accept"}
                        </button>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Modal;
