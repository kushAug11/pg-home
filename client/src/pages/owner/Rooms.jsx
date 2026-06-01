import React, { useState, useEffect } from 'react';
import ownerService from '../../services/owner.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SearchInput from '../../components/common/SearchInput';
import Skeleton from '../../components/common/Skeleton';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import { Plus, Trash2, Edit2, X, LayoutGrid, Map, Bed, ShieldAlert, ArrowRight, User, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tenantsLoading, setTenantsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasAccess, setHasAccess] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // grid | map
    const [selectedFloor, setSelectedFloor] = useState('');
    const [selectedRoomForDrawer, setSelectedRoomForDrawer] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Delete Modal Target
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [formData, setFormData] = useState({
        roomNumber: '',
        type: 'Single',
        rent: '',
        capacity: 1,
        amenities: ''
    });

    const fetchRoomsAndTenants = async () => {
        setLoading(true);
        setTenantsLoading(true);
        try {
            const res = await ownerService.getRooms();
            if (res.success) {
                setRooms(res.data);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
            if (error.response && error.response.status === 403) {
                setHasAccess(false);
            }
        }

        try {
            const res = await ownerService.getTenants();
            if (res.success) {
                setTenants(res.data);
            }
        } catch (error) {
            console.error('Error fetching tenants:', error);
        } finally {
            setLoading(false);
            setTenantsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomsAndTenants();
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [editingId, setEditingId] = useState(null);

    const handleEdit = (room) => {
        setFormData({
            roomNumber: room.number,
            type: room.type,
            rent: room.price,
            capacity: room.capacity,
            amenities: ''
        });
        setEditingId(room._id);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                const res = await ownerService.updateRoom(editingId, formData);
                if (res.success) {
                    setRooms(rooms.map(r => r._id === editingId ? res.data : r));
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({ roomNumber: '', type: 'Single', rent: '', capacity: 1, amenities: '' });
                    toast.success('Room updated successfully');
                    
                    // If the room currently open in drawer was edited, update its state
                    if (selectedRoomForDrawer && selectedRoomForDrawer._id === editingId) {
                        setSelectedRoomForDrawer(res.data);
                    }
                }
            } else {
                const res = await ownerService.createRoom(formData);
                if (res.success) {
                    setRooms([...rooms, res.data]);
                    setIsModalOpen(false);
                    setFormData({ roomNumber: '', type: 'Single', rent: '', capacity: 1, amenities: '' });
                    toast.success('Room created successfully');
                }
            }
        } catch (error) {
            console.error('Error saving room:', error);
            if (error.response && error.response.status === 403) {
                toast.error("Subscription Required: " + (error.response.data.message || "Please upgrade your plan."));
            } else {
                const msg = error.response?.data?.message || 'Failed to save room';
                toast.error(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await ownerService.deleteRoom(id);
            setRooms(rooms.filter(room => room._id !== id));
            toast.success('Room deleted successfully');
            if (selectedRoomForDrawer && selectedRoomForDrawer._id === id) {
                setDrawerOpen(false);
                setSelectedRoomForDrawer(null);
            }
        } catch (error) {
            console.error('Error deleting room:', error);
            if (error.response && error.response.status === 403) {
                toast.error("Subscription Required: " + (error.response.data.message || "Please upgrade."));
            } else {
                toast.error(error.response?.data?.message || 'Failed to delete room');
            }
        }
        setDeleteTarget(null);
    };

    if (!hasAccess) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-2xl text-center max-w-md animate-fadeIn">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🏠</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Premium Feature</h2>
                    <p className="text-slate-600 mb-6">
                        Room management is disabled for inactive subscriptions. Upgrade your plan to add or manage rooms.
                    </p>
                    <button
                        onClick={() => window.location.href = '/pricing'}
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                        View Plans
                    </button>
                </div>
            </div>
        );
    }

    // --- Search Filtering Logic ---
    const filteredRooms = rooms.filter(room =>
        room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Dynamic Floor Group Heuristics ---
    const getFloorGroup = (roomNumber) => {
        const match = roomNumber.match(/^(\d)/);
        return match ? `Floor ${match[1]}` : 'Ground Floor / General';
    };

    // Group rooms by floor
    const floorsMap = {};
    filteredRooms.forEach(room => {
        const floor = getFloorGroup(room.number);
        if (!floorsMap[floor]) {
            floorsMap[floor] = [];
        }
        floorsMap[floor].push(room);
    });

    const sortedFloors = Object.keys(floorsMap).sort();

    // Select default floor if empty
    if (sortedFloors.length > 0 && !selectedFloor) {
        setSelectedFloor(sortedFloors[0]);
    }

    const floorRooms = floorsMap[selectedFloor] || [];
    
    // Split corridor top and bottom wings
    const topWing = [];
    const bottomWing = [];
    floorRooms.forEach((room) => {
        const parsed = parseInt(room.number.replace(/\D/g, ''));
        const isOdd = isNaN(parsed) ? true : parsed % 2 !== 0;
        if (isOdd) {
            topWing.push(room);
        } else {
            bottomWing.push(room);
        }
    });

    // Distribute evenly if one wing is completely empty due to naming conventions
    if (floorRooms.length > 0 && (topWing.length === 0 || bottomWing.length === 0)) {
        topWing.length = 0;
        bottomWing.length = 0;
        floorRooms.forEach((room, idx) => {
            if (idx % 2 === 0) topWing.push(room);
            else bottomWing.push(room);
        });
    }

    const handleRoomClick = (room) => {
        setSelectedRoomForDrawer(room);
        setDrawerOpen(true);
    };

    const renderBeds = (occupied = 0, capacity = 1) => {
        const beds = [];
        for (let i = 0; i < capacity; i++) {
            const isOccupied = i < occupied;
            beds.push(
                <Bed 
                    key={i} 
                    size={16} 
                    className={`${isOccupied ? 'text-slate-500 fill-slate-400' : 'text-emerald-500 fill-emerald-100'}`} 
                />
            );
        }
        return <div className="flex gap-1.5 mt-2 justify-center flex-wrap">{beds}</div>;
    };

    const renderRoomMapBlock = (room) => {
        const occupied = room.occupied || 0;
        const capacity = room.capacity || 1;
        const isFull = occupied >= capacity;
        const isEmpty = occupied === 0;

        return (
            <button
                key={room._id}
                onClick={() => handleRoomClick(room)}
                className={`p-4 rounded-2xl border text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex flex-col items-center justify-between min-h-[120px] w-full ${
                    isFull 
                        ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:shadow-rose-100/50 hover:border-rose-300' 
                        : isEmpty 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:shadow-emerald-100/50 hover:border-emerald-300' 
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:shadow-amber-100/50 hover:border-amber-300'
                }`}
            >
                <div className="w-full flex justify-between items-start">
                    <span className="text-xs bg-white/75 backdrop-blur-sm border border-slate-100 px-2 py-0.5 rounded-full font-bold">
                        {room.type}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase">
                        {occupied}/{capacity} Beds
                    </span>
                </div>

                <div className="my-2">
                    <div className="font-extrabold text-lg leading-tight">Room {room.number}</div>
                    <div className="text-[10px] opacity-75 font-medium">₹{room.price}/mo</div>
                </div>

                <div className="w-full">
                    {renderBeds(occupied, capacity)}
                </div>
            </button>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn relative">
            
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        🏠 Room Management
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Manage hostel floor mappings, bed capacities, dynamic pricing, and occupancy logs.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* View Switch Toggle Pill */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                                viewMode === 'grid' 
                                    ? 'bg-white text-slate-800 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <LayoutGrid size={14} /> Grid Layout
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
                                viewMode === 'map' 
                                    ? 'bg-white text-slate-800 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Map size={14} /> Floor Map
                        </button>
                    </div>

                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search Room or Type..."
                    />

                    <Button onClick={() => { setEditingId(null); setFormData({ roomNumber: '', type: 'Single', rent: '', capacity: 1, amenities: '' }); setIsModalOpen(true); }} className="flex items-center gap-2 whitespace-nowrap">
                        <Plus size={20} /> Add Room
                    </Button>
                </div>
            </div>

            {/* Main Views Container */}
            {loading ? (
                /* Skeleton loader state */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                            <div className="flex justify-between">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-28" />
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : viewMode === 'grid' ? (
                /* 1. Grid Cards View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRooms.length === 0 ? (
                        <div className="bg-white border rounded-2xl p-16 text-center col-span-3">
                            <HelpCircle className="mx-auto text-slate-300 w-16 h-16 mb-4 animate-bounce" />
                            <p className="text-slate-500 font-medium">
                                {searchTerm ? 'No rooms match your search.' : 'No rooms added yet.'}
                            </p>
                        </div>
                    ) : (
                        filteredRooms.map((room) => (
                            <div key={room._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-extrabold text-slate-800">Room {room.number}</h3>
                                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
                                        {room.type}
                                    </span>
                                </div>
                                <div className="space-y-3 text-sm text-slate-600 mb-4">
                                    <p className="flex justify-between">
                                        <span>Rent:</span>
                                        <span className="font-extrabold text-slate-850">₹{room.price}/month</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span>Capacity:</span>
                                        <span className="font-bold text-slate-800">{room.capacity} Persons</span>
                                    </p>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span>Occupied</span>
                                            <span className={`font-extrabold ${
                                                (room.occupied || 0) >= room.capacity ? 'text-rose-600' :
                                                (room.occupied || 0) >= room.capacity * 0.75 ? 'text-amber-600' :
                                                'text-emerald-600'
                                            }`}>
                                                {room.occupied || 0}/{room.capacity}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    (room.occupied || 0) >= room.capacity ? 'bg-rose-500' :
                                                    (room.occupied || 0) >= room.capacity * 0.75 ? 'bg-amber-500' :
                                                    'bg-emerald-500'
                                                }`}
                                                style={{ width: `${Math.min(100, ((room.occupied || 0) / room.capacity) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                                    <button onClick={() => handleRoomClick(room)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors">
                                        Occupants <ArrowRight size={14} />
                                    </button>
                                    <button onClick={() => handleEdit(room)} className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => setDeleteTarget(room)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* 2. Corridor-Style Floor Layout Map View */
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-inner space-y-6 relative overflow-hidden animate-fadeIn">
                    
                    {/* Floor Selection Tabs */}
                    {sortedFloors.length === 0 ? (
                        <div className="text-center py-16 text-slate-500 bg-white border border-dashed rounded-2xl font-semibold">
                            No floors available. Add rooms with numerical values to render spatial maps.
                        </div>
                    ) : (
                        <>
                            <div className="flex border-b border-slate-200 pb-3 gap-2 overflow-x-auto custom-scrollbar">
                                {sortedFloors.map(floor => (
                                    <button
                                        key={floor}
                                        onClick={() => setSelectedFloor(floor)}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap shadow-sm border ${
                                            selectedFloor === floor 
                                                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white border-primary-600' 
                                                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        🏢 {floor}
                                    </button>
                                ))}
                            </div>

                            {/* Color Legend Indicators */}
                            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 bg-white/75 backdrop-blur-sm p-3 rounded-2xl border border-slate-100 w-fit">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-300 block" /> Fully Vacant
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-amber-300 block" /> Partially Occupied
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-300 block" /> Fully Occupied
                                </span>
                            </div>

                            {/* Map Canvas Layout */}
                            <div className="flex flex-col gap-6 relative min-h-[350px] justify-center items-stretch py-4">
                                
                                {/* North Wing (Top rooms) */}
                                {topWing.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-xs italic">No North Wing rooms found on this floor</div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                        {topWing.map(room => renderRoomMapBlock(room))}
                                    </div>
                                )}

                                {/* Central Hallway Corridor */}
                                <div className="h-12 bg-slate-200 border-y border-dashed border-slate-350 rounded-2xl flex items-center justify-between px-6 relative shadow-inner">
                                    <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-widest hidden md:inline">◀ LOBBY & STAIRS</span>
                                    <div className="h-0.5 w-1/4 bg-slate-300 border-t border-dashed hidden md:block"></div>
                                    <span className="text-slate-650 font-black text-xs tracking-widest uppercase bg-slate-200 px-4 z-10 mx-auto md:mx-0">
                                        Central Corridor Hallway
                                    </span>
                                    <div className="h-0.5 w-1/4 bg-slate-300 border-t border-dashed hidden md:block"></div>
                                    <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-widest hidden md:inline">FIRE ESCAPE ▶</span>
                                </div>

                                {/* South Wing (Bottom rooms) */}
                                {bottomWing.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-xs italic">No South Wing rooms found on this floor</div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                        {bottomWing.map(room => renderRoomMapBlock(room))}
                                    </div>
                                )}

                            </div>
                        </>
                    )}

                </div>
            )}

            {/* Sliding Occupant Details Drawer */}
            <div className={`fixed top-0 right-0 h-screen w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transition-transform duration-300 ease-in-out transform ${
                drawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
                {selectedRoomForDrawer && (
                    <>
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shadow-sm">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Room {selectedRoomForDrawer.number}</h2>
                                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Spatial Occupancy Info</span>
                            </div>
                            <button 
                                onClick={() => setDrawerOpen(false)} 
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            
                            {/* Overview Cards */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-4 rounded-2xl hover:bg-slate-100/50 transition">
                                    <span className="text-slate-500 font-bold text-sm">Room Bedding Type</span>
                                    <span className="bg-primary-50 border border-primary-200 text-primary-700 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                                        {selectedRoomForDrawer.type}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-4 rounded-2xl hover:bg-slate-100/50 transition">
                                    <span className="text-slate-500 font-bold text-sm">Monthly Rent Fee</span>
                                    <span className="text-slate-850 font-black text-lg">
                                        ₹{selectedRoomForDrawer.price}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-4 rounded-2xl hover:bg-slate-100/50 transition">
                                    <span className="text-slate-500 font-bold text-sm">Beds Occupancy</span>
                                    <div className="text-right">
                                        <span className="text-slate-800 font-extrabold block text-sm">
                                            {selectedRoomForDrawer.occupied || 0} / {selectedRoomForDrawer.capacity} Occupied
                                        </span>
                                        <span className="text-slate-400 text-xs font-semibold">
                                            {selectedRoomForDrawer.capacity - (selectedRoomForDrawer.occupied || 0)} vacant beds left
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Resident profiles in this room */}
                            <div>
                                <h3 className="font-extrabold text-slate-700 mb-3 text-xs tracking-wider uppercase">Room Occupants</h3>
                                
                                {tenantsLoading ? (
                                    <div className="flex items-center justify-center p-6 gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                                        <span className="text-slate-400 text-xs">Loading profiles...</span>
                                    </div>
                                ) : (() => {
                                    const roomOccupants = tenants.filter(t => {
                                        const rId = t.room_id?._id || t.room_id;
                                        return rId && rId.toString() === selectedRoomForDrawer._id.toString();
                                    });

                                    if (roomOccupants.length === 0) {
                                        return (
                                            <div className="bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 p-6 rounded-2xl text-center space-y-2">
                                                <Bed className="mx-auto text-emerald-400 animate-pulse" size={32} />
                                                <h4 className="font-extrabold text-sm">Room Fully Vacant</h4>
                                                <p className="text-emerald-600 text-xs">
                                                    There are no active tenants registered in this room.
                                                </p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-3">
                                            {roomOccupants.map(tenant => (
                                                <div key={tenant._id} className="border border-slate-150 rounded-2xl p-4 bg-slate-50 flex items-start gap-3 hover:shadow-sm transition">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center font-black text-slate-650 shadow-inner">
                                                        {tenant.user_id?.name ? tenant.user_id.name[0].toUpperCase() : <User size={16} />}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{tenant.user_id?.name || 'Resident'}</h4>
                                                        <p className="text-slate-500 text-xs font-semibold">{tenant.user_id?.email || 'N/A'}</p>
                                                        <p className="text-slate-500 text-xs font-semibold">Mob: {tenant.contact_number || tenant.mobile || 'N/A'}</p>
                                                        <p className="text-[10px] text-slate-400 pt-1 font-bold">
                                                            Joined: {new Date(tenant.moveInDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                        </div>

                        {/* Drawer Actions */}
                        <div className="p-6 border-t border-slate-150 flex gap-3 bg-slate-50">
                            <button 
                                onClick={() => { handleEdit(selectedRoomForDrawer); setDrawerOpen(false); }} 
                                className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-extrabold hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
                            >
                                <Edit2 size={14} /> Edit Room
                            </button>
                            <button 
                                onClick={() => { setDeleteTarget(selectedRoomForDrawer); setDrawerOpen(false); }} 
                                className="flex-1 bg-rose-50 border border-rose-200 text-rose-600 py-3 rounded-xl font-extrabold hover:bg-rose-100 transition shadow-sm flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
                            >
                                <Trash2 size={14} /> Delete Room
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Backdrop drawer overlay */}
            {drawerOpen && (
                <div 
                    onClick={() => setDrawerOpen(false)} 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 transition-opacity duration-300"
                />
            )}

            {/* Modal Form */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingId(null); setFormData({ roomNumber: '', type: 'Single', rent: '', capacity: 1, amenities: '' }); }}
                title={editingId ? 'Edit Room' : 'Add New Room'}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">{editingId ? 'Edit Room' : 'Add New Room'}</h2>
                        <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ roomNumber: '', type: 'Single', rent: '', capacity: 1, amenities: '' }); }}><X size={24} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Room Number" name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} required />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="Single">Single</option>
                                <option value="Double">Double</option>
                                <option value="Triple">Triple</option>
                                <option value="Dorm">Dorm</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Rent (₹)" name="rent" type="number" value={formData.rent} onChange={handleInputChange} required />
                            <Input label="Capacity" name="capacity" type="number" value={formData.capacity} onChange={handleInputChange} required />
                        </div>
                        <Button type="submit" className="w-full" isLoading={submitting}>
                            {editingId ? 'Update Room' : 'Create Room'}
                        </Button>
                    </form>
                </div>
            </Modal>

            {/* Confirm Delete Dialog */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Delete Room"
                    message={`Are you sure you want to delete Room ${deleteTarget.number}? This action cannot be undone and will delete associated records.`}
                    onConfirm={() => handleDelete(deleteTarget._id)}
                    onCancel={() => setDeleteTarget(null)}
                    confirmText="Delete Room"
                    variant="danger"
                />
            )}
        </div>
    );
};

export default Rooms;
