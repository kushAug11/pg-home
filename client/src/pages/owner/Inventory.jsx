import React, { useState, useEffect } from 'react';
import inventoryService from '../../services/inventory.service';
import ownerService from '../../services/owner.service';
import PageHeader from '../../components/common/PageHeader';
import { Package, Plus, Home, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

const Inventory = () => {
    const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'assign'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Item State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItemData, setNewItemData] = useState({ name: '', category: 'Furniture', total_qty: 0, cost: 0 });

    // Assignment State
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [assignData, setAssignData] = useState({ item_id: '', quantity: 1 });

    const fetchItems = async () => {
        try {
            const res = await inventoryService.getItems();
            if (res.success) setItems(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await ownerService.getRooms();
            if (res.success) setRooms(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchItems();
        if (activeTab === 'assign') fetchRooms();
    }, [activeTab]);

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const res = await inventoryService.addItem(newItemData);
            if (res.success) {
                toast.success('Item added to stock');
                setShowAddModal(false);
                setNewItemData({ name: '', category: 'Furniture', total_qty: 0, cost: 0 });
                fetchItems();
            }
        } catch (error) {
            toast.error('Failed to add item');
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedRoom || !assignData.item_id) return;
        try {
            const res = await inventoryService.assignItem({
                room_id: selectedRoom._id,
                item_id: assignData.item_id,
                quantity: assignData.quantity
            });
            if (res.success) {
                toast.success('Assigned to room');
                // Refresh room data locally to show update
                const updatedRoom = res.data;
                setRooms(prev => prev.map(r => r._id === updatedRoom._id ? updatedRoom : r));
                setSelectedRoom(updatedRoom); // Update selected view
                fetchItems(); // Refresh stock counts
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign');
        }
    };

    // Calculate total assets
    const totalAssetsValue = items.reduce((acc, item) => acc + (item.cost * item.total_qty), 0);

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <PageHeader title="Inventory Management" subtitle="Track assets and room assignments" />

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-slate-200">
                <button
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'stock' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('stock')}
                >
                    Stock Master
                </button>
                <button
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'assign' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('assign')}
                >
                    Room Assignment
                </button>
            </div>

            {/* STOCK TAB */}
            {activeTab === 'stock' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm">Total Items</p>
                            <p className="text-2xl font-bold text-slate-800">{items.reduce((acc, i) => acc + i.total_qty, 0)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 text-sm">Asset Value</p>
                            <p className="text-2xl font-bold text-slate-800">₹{totalAssetsValue.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center justify-end">
                            <Button onClick={() => setShowAddModal(true)}>
                                <Plus size={18} className="mr-2" /> Add New Item
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 font-semibold text-slate-600">Item Name</th>
                                    <th className="p-4 font-semibold text-slate-600">Category</th>
                                    <th className="p-4 font-semibold text-slate-600 text-center">Total Qty</th>
                                    <th className="p-4 font-semibold text-slate-600 text-center">Available</th>
                                    <th className="p-4 font-semibold text-slate-600 text-right">Cost/Unit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
                                ) : items.map(item => (
                                    <tr key={item._id} className="hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-800">{item.name}</td>
                                        <td className="p-4 text-slate-500"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{item.category}</span></td>
                                        <td className="p-4 text-center text-slate-700">{item.total_qty}</td>
                                        <td className="p-4 text-center font-bold text-emerald-600">{item.available_qty}</td>
                                        <td className="p-4 text-right text-slate-600">₹{item.cost}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ASSIGN TAB */}
            {activeTab === 'assign' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Room List */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-[500px] overflow-y-auto">
                            <h3 className="font-bold text-slate-800 mb-4 sticky top-0 bg-white pb-2 border-b">Select Room</h3>
                            <div className="space-y-2">
                                {rooms.map(room => (
                                    <div
                                        key={room._id}
                                        onClick={() => setSelectedRoom(room)}
                                        className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors
                                            ${selectedRoom?._id === room._id ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-200' : 'bg-slate-50 hover:bg-slate-100'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Home size={18} className="text-slate-400" />
                                            <span className="font-semibold text-slate-700">Room {room.number}</span>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Room Details & Actions */}
                    <div className="lg:col-span-2">
                        {selectedRoom ? (
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Home size={24} className="text-primary-600" />
                                        Room {selectedRoom.number} Inventory
                                    </h3>

                                    {/* Action: Assign */}
                                    <form onSubmit={handleAssign} className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100">
                                        <div className="flex-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Select Item</label>
                                            <select
                                                className="w-full p-2 rounded border border-slate-300"
                                                value={assignData.item_id}
                                                onChange={e => setAssignData({ ...assignData, item_id: e.target.value })}
                                            >
                                                <option value="">-- Choose Item --</option>
                                                {items.filter(i => i.available_qty > 0).map(i => (
                                                    <option key={i._id} value={i._id}>{i.name} (Avail: {i.available_qty})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Qty</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full p-2 rounded border border-slate-300"
                                                value={assignData.quantity}
                                                onChange={e => setAssignData({ ...assignData, quantity: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <Button type="submit">Assign</Button>
                                    </form>

                                    {/* Current Inventory List */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-slate-700">Assigned Items</h4>
                                        {(!selectedRoom.inventory || selectedRoom.inventory.length === 0) ? (
                                            <p className="text-slate-500 italic">No items assigned to this room yet.</p>
                                        ) : (
                                            selectedRoom.inventory.map((inv, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                                                    <div className="flex items-center gap-3">
                                                        <Package size={20} className="text-slate-400" />
                                                        <div>
                                                            <p className="font-semibold text-slate-800">{inv.item?.name || 'Unknown Item'}</p>
                                                            <p className="text-xs text-slate-500">{inv.item?.category || 'General'}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-lg bg-slate-100 px-3 py-1 rounded-lg text-slate-700">x{inv.quantity}</span>
                                                    {/* Return Button could go here later */}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12">
                                <Home size={48} className="mb-4 opacity-50" />
                                <p>Select a room to manage its inventory</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Add New Inventory Item</h2>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <Input label="Item Name" required value={newItemData.name} onChange={e => setNewItemData({ ...newItemData, name: e.target.value })} />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select
                                    className="w-full p-2 border rounded-lg"
                                    value={newItemData.category}
                                    onChange={e => setNewItemData({ ...newItemData, category: e.target.value })}
                                >
                                    <option>Furniture</option>
                                    <option>Electronics</option>
                                    <option>Linen</option>
                                    <option>Kitchen</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input type="number" label="Total Quantity" required min="0" value={newItemData.total_qty} onChange={e => setNewItemData({ ...newItemData, total_qty: parseInt(e.target.value) })} />
                                <Input type="number" label="Cost per Unit" min="0" value={newItemData.cost} onChange={e => setNewItemData({ ...newItemData, cost: parseInt(e.target.value) })} />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button type="submit">Add Item</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
