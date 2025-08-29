export default function Sidebar() {
    return (
        <div className="w-64 bg-gray-50 border-r border-gray-100 shadow-xl h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 h-18">
                <h1 className="text-2xl font-bold">Sidebar</h1>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
                <h2 className="text-lg font-bold">Conversas</h2>
            </div>
        </div>
    );
}