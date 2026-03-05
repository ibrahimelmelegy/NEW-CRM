import VirtualRoom from './virtualRoomModel';
import { tenantWhere, tenantCreate } from '../utils/tenantScope';

class VirtualOfficeService {
  async getRooms(user: unknown) {
    return VirtualRoom.findAll({
      where: { ...tenantWhere(user) },
      order: [['createdAt', 'ASC']]
    });
  }

  async createRoom(data: unknown, user: unknown) {
    return VirtualRoom.create(
      tenantCreate(
        {
          name: data.name,
          type: data.type || 'office',
          icon: data.icon || '🏢',
          color: data.color || '#7c3aed',
          capacity: data.capacity || 10,
          description: data.description || null,
          isLocked: data.isLocked || false
        },
        user
      )
    );
  }

  async updateRoom(id: number, data: unknown, user: unknown) {
    const room = await VirtualRoom.findOne({ where: { id, ...tenantWhere(user) } });
    if (!room) throw new Error('Room not found');
    await room.update(data);
    return room;
  }

  async deleteRoom(id: number, user: unknown) {
    const room = await VirtualRoom.findOne({ where: { id, ...tenantWhere(user) } });
    if (!room) throw new Error('Room not found');
    await room.destroy();
    return { deleted: true };
  }

  async seedDefaultRooms(tenantId?: string) {
    const where = tenantId ? { tenantId } : {};
    const count = await VirtualRoom.count({ where });
    if (count > 0) return;

    const defaults = [
      { name: 'Main Office', type: 'office', icon: '🏢', color: '#7c3aed', capacity: 50, description: 'General workspace — open for everyone' },
      { name: 'Meeting Room A', type: 'meeting', icon: '🤝', color: '#3b82f6', capacity: 10, description: 'Client calls & team meetings' },
      { name: 'Meeting Room B', type: 'meeting', icon: '📋', color: '#06b6d4', capacity: 8, description: 'Internal syncs' },
      { name: 'Coffee Lounge', type: 'lounge', icon: '☕', color: '#f59e0b', capacity: 20, description: 'Casual chat — take a break!' },
      { name: 'Focus Zone', type: 'focus', icon: '🎯', color: '#22c55e', capacity: 15, description: 'Deep work — minimal interruptions' },
      { name: 'Phone Booth', type: 'call', icon: '📞', color: '#ef4444', capacity: 1, description: 'Private calls' }
    ];

    await VirtualRoom.bulkCreate(defaults.map(r => ({ ...r, isLocked: false, tenantId })));
  }
}

export default new VirtualOfficeService();
