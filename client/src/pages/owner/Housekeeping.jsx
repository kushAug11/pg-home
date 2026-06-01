import React, { useState, useEffect } from 'react';
import housekeepingService from '../../services/housekeeping.service';
import PageHeader from '../../components/common/PageHeader';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const Housekeeping = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchDailyStatus = async () => {
        setLoading(true);
        try {
            const data = await housekeepingService.getDailyStatus(selectedDate);
            setRooms(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load housekeeping data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDailyStatus();
    }, [selectedDate]);

    const handleStatusUpdate = async (roomId, newStatus) => {
        // Optimistic Update
        const originalRooms = [...rooms];
        setRooms(prev => prev.map(r =>
            r.room_id === roomId ? { ...r, status: newStatus } : r
        ));

        try {
            await housekeepingService.logCleaning({
                room_id: roomId,
                date: selectedDate,
                status: newStatus
            });
            toast.success(`Marked as ${newStatus}`);
        } catch (error) {
            toast.error('Failed to update status');
            setRooms(originalRooms); // Revert
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <PageHeader
                title="Housekeeping & Cleaning"
                subtitle="Track daily room cleaning status"
            >
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                    <Calendar size={18} className="text-slate-500" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="outline-none text-sm text-slate-700 bg-transparent"
                    />
                </div>
            </PageHeader>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {rooms.map(room => (
                        <div key={room.room_id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-heading font-bold text-lg text-slate-800">Room {room.room_number}</span>
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Floor {room.floor}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-4">
                                    {room.status === 'Cleaned' && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Cleaned</span>}
                                    {room.status === 'Skipped' && <span className="text-xs font-bold text-red-600 flex items-center gap-1"><XCircle size={12} /> Skipped</span>}
                                    {room.status === 'Pending' && <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12} /> Pending</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleStatusUpdate(room.room_id, 'Cleaned')}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1
                                        ${room.status === 'Cleaned'
                                            ? 'bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-1'
                                            : 'bg-slate-50 text-slate-600 hover:bg-green-50 hover:text-green-600'
                                        }`}
                                >
                                    <CheckCircle size={14} /> Cleaned
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(room.room_id, 'Skipped')}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1
                                        ${room.status === 'Skipped'
                                            ? 'bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-1'
                                            : 'bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600'
                                        }`}
                                >
                                    <XCircle size={14} /> Skip
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Housekeeping;
