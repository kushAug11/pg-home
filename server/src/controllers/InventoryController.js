const InventoryItem = require('../models/InventoryItem');
const Room = require('../models/Room');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Owner
exports.getItems = async (req, res) => {
    try {
        const pg_id = req.user.pg_id;
        const items = await InventoryItem.find({ pg_id });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add new inventory item
// @route   POST /api/inventory
// @access  Owner
exports.addItem = async (req, res) => {
    try {
        const { name, category, total_qty, cost } = req.body;
        const pg_id = req.user.pg_id;

        const newItem = await InventoryItem.create({
            pg_id,
            name,
            category,
            total_qty,
            available_qty: total_qty, // Initially all are available
            cost
        });

        res.status(201).json({ success: true, data: newItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Assign item to room
// @route   POST /api/inventory/assign
// @access  Owner
exports.assignItem = async (req, res) => {
    try {
        const { room_id, item_id, quantity } = req.body;
        const qty = parseInt(quantity);

        // 1. Check Item Availability
        const item = await InventoryItem.findById(item_id);
        if (!item || item.available_qty < qty) {
            return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }

        // 2. Decrement Stock
        item.available_qty -= qty;
        await item.save();

        // 3. Add to Room
        const room = await Room.findById(room_id);

        // Check if item already exists in room
        const existingItemIndex = room.inventory.findIndex(i => i.item.toString() === item_id);

        if (existingItemIndex > -1) {
            room.inventory[existingItemIndex].quantity += qty;
        } else {
            room.inventory.push({ item: item_id, quantity: qty });
        }

        await room.save();

        res.json({ success: true, message: 'Item assigned to room', data: room });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Return item from room
// @route   POST /api/inventory/return
// @access  Owner
exports.returnItem = async (req, res) => {
    try {
        const { room_id, item_id, quantity } = req.body;
        const qty = parseInt(quantity);

        const room = await Room.findById(room_id);
        const itemIndex = room.inventory.findIndex(i => i.item.toString() === item_id);

        if (itemIndex === -1 || room.inventory[itemIndex].quantity < qty) {
            return res.status(400).json({ success: false, message: 'Item not found in room or quantity mismatch' });
        }

        // 1. Remove from Room
        room.inventory[itemIndex].quantity -= qty;
        if (room.inventory[itemIndex].quantity <= 0) {
            room.inventory.splice(itemIndex, 1);
        }
        await room.save();

        // 2. Increment Stock
        const item = await InventoryItem.findById(item_id);
        item.available_qty += qty;
        await item.save();

        res.json({ success: true, message: 'Item returned to stock' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
