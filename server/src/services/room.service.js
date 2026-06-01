const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { ApiError } = require('../middlewares/error.middleware');

class RoomService {
    /**
     * Create a new room for a PG
     */
    async createRoom(pgId, roomData) {
        const { roomNumber, type, rent, capacity } = roomData;

        // Verify uniqueness
        const roomExists = await Room.findOne({ pg_id: pgId, number: roomNumber });
        if (roomExists) {
            throw new ApiError(400, 'Room number already exists in this PG');
        }

        const room = await Room.create({
            pg_id: pgId,
            number: roomNumber,
            type,
            price: rent,
            capacity
        });

        return room;
    }

    /**
     * Update an existing room
     */
    async updateRoom(roomId, pgId, updateData) {
        const room = await Room.findById(roomId);

        if (!room) {
            throw new ApiError(404, 'Room not found');
        }

        if (room.pg_id.toString() !== pgId.toString()) {
            throw new ApiError(403, 'Not authorized to modify this room');
        }

        // Apply updates
        const updatedRoom = await Room.findByIdAndUpdate(roomId, updateData, {
            new: true,
            runValidators: true
        });

        return updatedRoom;
    }

    /**
     * Delete a room and cascade delete associated tenants and their user accounts
     */
    async deleteRoom(roomId, pgId) {
        const room = await Room.findById(roomId);

        if (!room) {
            throw new ApiError(404, 'Room not found');
        }

        if (room.pg_id.toString() !== pgId.toString()) {
            throw new ApiError(403, 'Not authorized to delete this room');
        }

        // CASCADE DELETE: Find and delete associated tenants
        const tenants = await Tenant.find({ room_id: room._id });
        const userIds = tenants.map(t => t.user_id);

        let deletedTenantsCount = tenants.length;

        // 1. Delete associated User accounts
        if (userIds.length > 0) {
            await User.deleteMany({ _id: { $in: userIds } });
        }

        // 2. Delete Tenant records
        if (deletedTenantsCount > 0) {
            await Tenant.deleteMany({ room_id: room._id });
        }

        // 3. Delete Room
        await room.deleteOne();

        return { deletedTenantsCount };
    }
}

module.exports = new RoomService();
