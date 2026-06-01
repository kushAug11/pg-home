const HousekeepingLog = require('../models/HousekeepingLog');
const Room = require('../models/Room');

// Get Daily Status (Owner)
exports.getDailyStatus = async (req, res) => {
    try {
        const { date } = req.query;
        const pg_id = req.user.pg_id;

        const queryDate = new Date(date || Date.now());
        queryDate.setHours(0, 0, 0, 0);

        // 1. Get all rooms for this PG
        const rooms = await Room.find({ pg_id }).select('number floor room_type');

        // 2. Get logs for this date
        // Create range for the whole day to be safe, or just match normalized date if stored normalized
        const nextDay = new Date(queryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const logs = await HousekeepingLog.find({
            pg_id,
            date: { $gte: queryDate, $lt: nextDay }
        });

        // 3. Merge data
        const result = rooms.map(room => {
            const log = logs.find(l => l.room_id.toString() === room._id.toString());
            return {
                room_id: room._id,
                room_number: room.number,
                floor: room.floor,
                status: log ? log.status : 'Pending',
                cleanedBy: log ? log.cleanedBy : '',
                log_id: log ? log._id : null
            };
        });

        // Sort by room number (parseInt for numeric sort if possible, else string)
        result.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Log Cleaning (Update Status)
exports.logCleaning = async (req, res) => {
    try {
        const { room_id, date, status, cleanedBy } = req.body;
        const pg_id = req.user.pg_id;

        const logDate = new Date(date);
        logDate.setHours(0, 0, 0, 0);

        const log = await HousekeepingLog.findOneAndUpdate(
            { pg_id, room_id, date: logDate },
            { status, cleanedBy },
            { new: true, upsert: true } // Create if not exists
        );

        res.json(log);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 
