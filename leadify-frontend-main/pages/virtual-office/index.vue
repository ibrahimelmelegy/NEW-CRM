<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 🏢 Virtual Office
      p.text-sm.mt-1(style="color: var(--text-muted);") Your team's digital workspace — join rooms, set status, collaborate in real-time.
    .flex.items-center.gap-3
      //- Status Selector
      el-dropdown(trigger="click" @command="handleStatus")
        el-button(size="default" style="border-radius: 12px;")
          .flex.items-center.gap-2
            .w-3.h-3.rounded-full(:style="{ backgroundColor: statusColor(currentUser.status) }")
            span {{ statusLabel(currentUser.status) }}
        template(#dropdown)
          el-dropdown-menu
            el-dropdown-item(command="available") 🟢 Available
            el-dropdown-item(command="busy") 🔴 Busy
            el-dropdown-item(command="away") 🟡 Away
            el-dropdown-item(command="dnd") ⛔ Do Not Disturb
      el-button(size="default" :type="currentUser.focusMode ? 'danger' : 'default'" @click="toggleFocusMode" style="border-radius: 12px;")
        Icon(name="ph:crosshair" size="16" style="margin-right: 4px;")
        | {{ currentUser.focusMode ? 'Exit Focus' : 'Focus Mode' }}
      el-button(size="default" @click="showRoomDialog = true" style="border-radius: 12px;")
        Icon(name="ph:plus" size="16" style="margin-right: 4px;")
        | Add Room

  //- Stats Bar
  .grid.grid-cols-4.gap-4.mb-8
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Rooms
      p.text-2xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.totalRooms }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Online Now
      p.text-2xl.font-black.mt-1(style="color: #22c55e;") {{ stats.onlineNow }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Meeting Rooms
      p.text-2xl.font-black.mt-1(style="color: #3b82f6;") {{ stats.meetingRooms }}
    .p-4.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Active Meetings
      p.text-2xl.font-black.mt-1(style="color: #f59e0b;") {{ stats.activeMeetings }}

  //- Current Room Banner
  .p-5.rounded-2xl.border-2.mb-8.flex.items-center.justify-between(
    v-if="currentRoom"
    :style="{ borderColor: currentRoom.color + '60', background: currentRoom.color + '08' }"
  )
    .flex.items-center.gap-4
      .w-14.h-14.rounded-2xl.flex.items-center.justify-center.text-2xl(:style="{ backgroundColor: currentRoom.color + '20' }") {{ currentRoom.icon }}
      div
        p.text-lg.font-black(style="color: var(--text-primary);") You're in: {{ currentRoom.name }}
        p.text-xs(style="color: var(--text-muted);") {{ currentRoom.occupants.length }} / {{ currentRoom.capacity }} people
    .flex.items-center.gap-2
      el-button(:type="myOccupant?.isMuted ? 'danger' : 'default'" circle @click="toggleMute")
        Icon(:name="myOccupant?.isMuted ? 'ph:microphone-slash' : 'ph:microphone'" size="18")
      el-button(:type="myOccupant?.isCameraOn ? 'primary' : 'default'" circle @click="toggleCamera")
        Icon(:name="myOccupant?.isCameraOn ? 'ph:video-camera' : 'ph:video-camera-slash'" size="18")
      el-button(:type="myOccupant?.isScreenSharing ? 'success' : 'default'" circle @click="toggleScreenShare")
        Icon(name="ph:monitor-arrow-up" size="18")
      el-button(type="danger" @click="leaveRoom" style="border-radius: 12px;")
        Icon(name="ph:sign-out" size="16" style="margin-right: 4px;")
        | Leave

  //- Rooms Grid
  .grid.grid-cols-3.gap-5
    .rounded-2xl.border.overflow-hidden.transition-all(
      v-for="room in rooms"
      :key="room.id"
      :style="{ borderColor: room.id === currentUser.currentRoomId ? room.color : 'var(--border-default)' }"
      :class="{ 'ring-2': room.id === currentUser.currentRoomId }"
      class="hover:shadow-lg"
    )
      //- Room Header
      .px-5.py-4.flex.items-center.justify-between(:style="{ background: room.color + '10' }")
        .flex.items-center.gap-3
          .w-10.h-10.rounded-xl.flex.items-center.justify-center.text-lg(:style="{ backgroundColor: room.color + '20' }") {{ room.icon }}
          div
            h3.text-sm.font-black(style="color: var(--text-primary);") {{ room.name }}
            p.text-xs(style="color: var(--text-muted);") {{ room.description }}
        .flex.items-center.gap-2
          div(class="px-2 py-0.5 rounded-full text-xs font-bold" :style="{ backgroundColor: room.color + '15', color: room.color }") {{ room.occupants.length }}/{{ room.capacity }}

      //- Occupants
      .px-5.py-4(style="min-height: 80px;")
        .flex.flex-wrap.gap-2(v-if="room.occupants.length > 0")
          div(class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            v-for="occ in room.occupants"
            :key="occ.id"
            style="background: var(--bg-elevated); border: 1px solid var(--border-default);"
          )
            .relative
              .w-6.h-6.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(style="background: linear-gradient(135deg, #7c3aed, #4f46e5);") {{ occ.name.slice(0,1) }}
              div(class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" :style="{ backgroundColor: statusColor(occ.status) }")
            span {{ occ.name }}
            Icon(v-if="occ.isMuted" name="ph:microphone-slash" size="12" style="color: #ef4444;")
            Icon(v-if="occ.isCameraOn" name="ph:video-camera" size="12" style="color: #22c55e;")
            Icon(v-if="occ.isScreenSharing" name="ph:monitor-arrow-up" size="12" style="color: #3b82f6;")
        .text-center.py-3(v-else)
          p.text-xs(style="color: var(--text-muted);") Empty — be the first to join!

      //- Room Footer
      .px-5.py-3.border-t(style="border-color: var(--border-default);")
        el-button(
          v-if="currentUser.currentRoomId !== room.id"
          size="small"
          type="primary"
          @click="joinRoom(room.id)"
          :disabled="room.occupants.length >= room.capacity"
          :style="{ background: room.color, border: 'none', borderRadius: '10px' }"
        )
          Icon(name="ph:sign-in" size="14" style="margin-right: 4px;")
          | Join
        el-tag(v-else size="small" type="success" round effect="plain") ✓ You're here

  //- Add Room Dialog
  el-dialog(v-model="showRoomDialog" title="Add Room" width="480px")
    el-form(label-position="top" size="large")
      el-form-item(label="Room Name")
        el-input(v-model="roomForm.name" placeholder="Design Studio")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Type")
          el-select(v-model="roomForm.type" class="w-full")
            el-option(label="🏢 Office" value="office")
            el-option(label="🤝 Meeting" value="meeting")
            el-option(label="☕ Lounge" value="lounge")
            el-option(label="🎯 Focus" value="focus")
            el-option(label="📞 Call" value="call")
        el-form-item(label="Capacity")
          el-input-number(v-model="roomForm.capacity" :min="1" :max="100" class="!w-full")
      el-form-item(label="Description")
        el-input(v-model="roomForm.description" placeholder="What's this room for?")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Icon")
          el-input(v-model="roomForm.icon" placeholder="🏢")
        el-form-item(label="Color")
          el-color-picker(v-model="roomForm.color")
    template(#footer)
      el-button(@click="showRoomDialog = false") Cancel
      el-button(type="primary" @click="saveRoom" style="border-radius: 12px;") Create Room
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useVirtualOffice } from '~/composables/useVirtualOffice';

definePageMeta({});

const {
  rooms,
  currentUser,
  currentRoom,
  stats,
  init,
  joinRoom,
  leaveRoom,
  setStatus,
  toggleMute,
  toggleCamera,
  toggleScreenShare,
  addRoom,
  toggleFocusMode
} = useVirtualOffice();

onMounted(() => {
  init();
});

const showRoomDialog = ref(false);
const roomForm = reactive({ name: '', type: 'office' as const, capacity: 10, description: '', icon: '🏢', color: '#7c3aed', isLocked: false });

const myOccupant = computed(() => currentRoom.value?.occupants.find(o => o.id === currentUser.value.userId));

function handleStatus(status: string) {
  setStatus(status as any);
}
async function saveRoom() {
  await addRoom({ ...roomForm } as any);
  Object.assign(roomForm, { name: '', type: 'office', capacity: 10, description: '', icon: '🏢', color: '#7c3aed', isLocked: false });
  showRoomDialog.value = false;
  ElMessage.success('Room created!');
}

function statusColor(s: string): string {
  return { available: '#22c55e', busy: '#ef4444', away: '#f59e0b', dnd: '#dc2626', offline: '#6b7280' }[s] || '#6b7280';
}
function statusLabel(s: string): string {
  return { available: '🟢 Available', busy: '🔴 Busy', away: '🟡 Away', dnd: '⛔ DND', offline: '⚫ Offline' }[s] || s;
}
</script>
