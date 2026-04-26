export default function Dashboard() {
    return (
        <div className="pt-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-2">View your account summary and activity</p>

            <div className="mt-6 p-4 bg-white rounded-lg shadow">
                <h2 className="text-lg font-medium text-gray-800">Account Summary</h2>
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded">
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className="text-xl font-bold text-gray-900">$0.00</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                        <p className="text-sm text-gray-600">Last Payment</p>
                        <p className="text-xl font-bold text-gray-900">$0.00</p>
                    </div>
                </div>
            </div>
        </div>
    )
} 