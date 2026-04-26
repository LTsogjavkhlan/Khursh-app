import { useState } from 'react'

export default function Requests() {
    const [activeTab, setActiveTab] = useState('new')

    const myRequests = [
        { id: 1, type: 'Maintenance', title: 'Leaking Faucet', status: 'In Progress', date: '2024-06-28' },
        { id: 2, type: 'Complaint', title: 'Noise Complaint', status: 'Resolved', date: '2024-06-15' }
    ]

    return (
        <div className="pt-6">
            <h1 className="text-2xl font-bold text-gray-800">Requests</h1>
            <p className="text-gray-600 mt-2">Submit and track maintenance requests</p>

            <div className="mt-6 flex border-b">
                <button
                    className={`py-2 px-4 font-medium ${activeTab === 'new'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500'}`}
                    onClick={() => setActiveTab('new')}
                >
                    New Request
                </button>
                <button
                    className={`py-2 px-4 font-medium ${activeTab === 'my'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500'}`}
                    onClick={() => setActiveTab('my')}
                >
                    My Requests
                </button>
            </div>

            {activeTab === 'new' ? (
                <div className="mt-6 bg-white rounded-lg shadow p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                            <select className="w-full p-2 border rounded-md">
                                <option>Maintenance</option>
                                <option>Complaint</option>
                                <option>Suggestion</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input type="text" className="w-full p-2 border rounded-md" placeholder="Brief description" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                            <div className="border rounded-md overflow-hidden">
                                <textarea
                                    className="w-full p-2 h-24 resize-none focus:outline-none"
                                    placeholder="Describe your request in detail"
                                ></textarea>
                            </div>
                        </div>

                        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors">
                            Submit Request
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-6 space-y-4">
                    {myRequests.map(request => (
                        <div key={request.id} className="bg-white rounded-lg shadow p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium">{request.title}</h3>
                                    <p className="text-sm text-gray-500">{request.type} • {request.date}</p>
                                </div>
                                <span className={`text-sm px-2 py-1 rounded-full ${request.status === 'Resolved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {request.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
} 