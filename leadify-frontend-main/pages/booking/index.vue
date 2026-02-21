<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Booking & Scheduling</h1>
          <p class="text-slate-400 text-sm mt-1">Manage appointments, meetings, and resource bookings with calendar sync.</p>
        </div>
        <div class="flex gap-2">
          <el-button-group>
            <el-button :type="viewMode === 'day' ? 'primary' : 'default'" size="small" @click="viewMode = 'day'">Day</el-button>
            <el-button :type="viewMode === 'week' ? 'primary' : 'default'" size="small" @click="viewMode = 'week'">Week</el-button>
            <el-button :type="viewMode === 'list' ? 'primary' : 'default'" size="small" @click="viewMode = 'list'">List</el-button>
          </el-button-group>
          <el-button type="primary" class="!rounded-xl" @click="showBookingDialog = true">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            New Booking
          </el-button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ todayBookings }}</div>
        <div class="text-xs text-slate-500 mt-1">Today's Bookings</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ weekBookings }}</div>
        <div class="text-xs text-slate-500 mt-1">This Week</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ bookings.filter(b => b.status === 'CONFIRMED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Confirmed</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ bookings.filter(b => b.status === 'PENDING').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Pending</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ noShowRate }}%</div>
        <div class="text-xs text-slate-500 mt-1">No-show Rate</div>
      </div>
    </div>

    <!-- Calendar/Day View -->
    <div v-if="viewMode === 'day' || viewMode === 'week'" class="glass-panel rounded-2xl overflow-hidden">
      <!-- Day Header -->
      <div class="p-4 border-b border-slate-800/60 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <el-button text @click="navigateDay(-1)"><Icon name="ph:caret-left" class="w-5 h-5" /></el-button>
          <h3 class="text-lg font-medium text-slate-200">{{ currentDateLabel }}</h3>
          <el-button text @click="navigateDay(1)"><Icon name="ph:caret-right" class="w-5 h-5" /></el-button>
        </div>
        <el-button text type="primary" @click="goToToday">Today</el-button>
      </div>

      <!-- Time Slots -->
      <div class="max-h-[600px] overflow-y-auto">
        <div v-for="hour in timeSlots" :key="hour" class="flex border-b border-slate-800/20 min-h-[60px] group hover:bg-slate-800/10">
          <div class="w-20 flex-shrink-0 p-2 text-right text-xs text-slate-500 border-r border-slate-800/30">
            {{ formatHour(hour) }}
          </div>
          <div class="flex-1 relative p-1">
            <!-- Booking Blocks -->
            <div
              v-for="booking in getBookingsForHour(hour)"
              :key="booking.id"
              class="absolute left-1 right-1 rounded-lg px-3 py-2 cursor-pointer transition-all hover:brightness-110 z-10"
              :style="{ backgroundColor: booking.color + '20', borderLeft: `3px solid ${booking.color}`, top: '2px' }"
              @click="openBooking(booking)"
            >
              <div class="flex justify-between items-start">
                <div>
                  <div class="text-sm font-medium text-slate-200">{{ booking.title }}</div>
                  <div class="text-xs text-slate-500">{{ booking.time }} - {{ booking.clientName }}</div>
                </div>
                <el-tag :type="getBookingStatusType(booking.status)" effect="dark" size="small" class="!text-[10px]">
                  {{ booking.status }}
                </el-tag>
              </div>
            </div>

            <!-- Add button on hover -->
            <div class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition">
              <el-button text size="small" type="primary" @click="quickBook(hour)">
                <Icon name="ph:plus" class="w-4 h-4" />
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-if="viewMode === 'list'" class="glass-panel p-6 rounded-2xl">
      <el-table :data="bookings" class="glass-table" stripe>
        <el-table-column label="Booking" min-width="250">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-1 h-10 rounded-full" :style="{ backgroundColor: row.color }"></div>
              <div>
                <div class="text-sm font-medium text-slate-200">{{ row.title }}</div>
                <div class="text-xs text-slate-500">{{ row.type }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Client" width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-avatar :size="24" class="bg-slate-700">{{ row.clientName?.charAt(0) }}</el-avatar>
              <span class="text-sm text-slate-300">{{ row.clientName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Date & Time" width="200">
          <template #default="{ row }">
            <div class="text-sm text-slate-200">{{ formatDate(row.date) }}</div>
            <div class="text-xs text-slate-500">{{ row.time }} ({{ row.duration }}min)</div>
          </template>
        </el-table-column>
        <el-table-column label="Host" width="150">
          <template #default="{ row }">
            <span class="text-sm text-slate-400">{{ row.host }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Status" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getBookingStatusType(row.status)" effect="dark" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="150" align="center">
          <template #default="{ row }">
            <div class="flex gap-1 justify-center">
              <el-button v-if="row.status === 'PENDING'" text type="success" size="small" @click="confirmBooking(row)">
                <Icon name="ph:check-bold" class="w-4 h-4" />
              </el-button>
              <el-button text type="primary" size="small" @click="openBooking(row)">
                <Icon name="ph:eye-bold" class="w-4 h-4" />
              </el-button>
              <el-button text type="danger" size="small" @click="cancelBooking(row)">
                <Icon name="ph:x-bold" class="w-4 h-4" />
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Booking Types / Links -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-sm font-medium text-slate-300">Booking Pages</h3>
        <el-button type="primary" size="small" @click="showBookingTypeDialog = true">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          New Page
        </el-button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="page in bookingPages"
          :key="page.id"
          class="p-4 rounded-xl border border-slate-700/50 bg-slate-800/20 hover:border-primary-500/30 transition"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ backgroundColor: page.color + '20' }">
              <Icon :name="page.icon" class="w-5 h-5" :style="{ color: page.color }" />
            </div>
            <div>
              <h4 class="text-sm font-medium text-slate-200">{{ page.name }}</h4>
              <p class="text-xs text-slate-500">{{ page.duration }}min - {{ page.type }}</p>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-500">
            <span>{{ page.bookings }} bookings</span>
            <el-button text type="primary" size="small" @click="copyBookingLink(page)">
              <Icon name="ph:link" class="w-3 h-3 mr-1" />
              Copy Link
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- New Booking Dialog -->
    <el-dialog v-model="showBookingDialog" title="New Booking" width="520px">
      <el-form label-position="top">
        <el-form-item label="Title">
          <el-input v-model="newBooking.title" placeholder="e.g., Product Demo - Acme Corp" />
        </el-form-item>
        <el-form-item label="Client">
          <el-input v-model="newBooking.clientName" placeholder="Client name" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Date">
            <el-date-picker v-model="newBooking.date" type="date" class="w-full" />
          </el-form-item>
          <el-form-item label="Time">
            <el-time-picker v-model="newBooking.time" format="HH:mm" class="w-full" />
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Duration">
            <el-select v-model="newBooking.duration" class="w-full">
              <el-option label="15 minutes" :value="15" />
              <el-option label="30 minutes" :value="30" />
              <el-option label="45 minutes" :value="45" />
              <el-option label="60 minutes" :value="60" />
              <el-option label="90 minutes" :value="90" />
            </el-select>
          </el-form-item>
          <el-form-item label="Type">
            <el-select v-model="newBooking.type" class="w-full">
              <el-option label="Meeting" value="MEETING" />
              <el-option label="Demo" value="DEMO" />
              <el-option label="Consultation" value="CONSULTATION" />
              <el-option label="Follow-up" value="FOLLOWUP" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="Location / Link">
          <el-input v-model="newBooking.location" placeholder="Office room or meeting link" />
        </el-form-item>
        <el-form-item label="Notes">
          <el-input v-model="newBooking.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBookingDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createBooking">Schedule</el-button>
      </template>
    </el-dialog>

    <!-- Booking Type Dialog -->
    <el-dialog v-model="showBookingTypeDialog" title="Create Booking Page" width="480px">
      <el-form label-position="top">
        <el-form-item label="Page Name">
          <el-input v-model="newPage.name" placeholder="e.g., 30-min Demo Call" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Duration (min)">
            <el-input-number v-model="newPage.duration" :min="15" :step="15" class="!w-full" />
          </el-form-item>
          <el-form-item label="Type">
            <el-select v-model="newPage.type" class="w-full">
              <el-option label="One-on-One" value="ONE_ON_ONE" />
              <el-option label="Group" value="GROUP" />
              <el-option label="Round Robin" value="ROUND_ROBIN" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="Buffer Time (min)">
          <el-input-number v-model="newPage.buffer" :min="0" :step="5" class="!w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBookingTypeDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createBookingPage">Create</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const viewMode = ref('day');
const showBookingDialog = ref(false);
const showBookingTypeDialog = ref(false);
const currentDate = ref(new Date());

const newBooking = ref({ title: '', clientName: '', date: '', time: '', duration: 30, type: 'MEETING', location: '', notes: '' });
const newPage = ref({ name: '', duration: 30, type: 'ONE_ON_ONE', buffer: 10 });

const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

const bookings = ref([
  {
    id: 1,
    title: 'Product Demo - TechCorp',
    clientName: 'Ahmed Al-Farsi',
    date: '2026-02-20',
    time: '09:00',
    duration: 60,
    type: 'DEMO',
    host: 'Sara M.',
    status: 'CONFIRMED',
    color: '#6366F1',
    hour: 9
  },
  {
    id: 2,
    title: 'Q1 Strategy Meeting',
    clientName: 'Internal',
    date: '2026-02-20',
    time: '10:30',
    duration: 90,
    type: 'MEETING',
    host: 'Ahmed F.',
    status: 'CONFIRMED',
    color: '#10B981',
    hour: 10
  },
  {
    id: 3,
    title: 'Consultation - StartupX',
    clientName: 'Omar Hassan',
    date: '2026-02-20',
    time: '13:00',
    duration: 45,
    type: 'CONSULTATION',
    host: 'Fatima A.',
    status: 'PENDING',
    color: '#F59E0B',
    hour: 13
  },
  {
    id: 4,
    title: 'Follow-up - Deal #234',
    clientName: 'Khalid Ibrahim',
    date: '2026-02-20',
    time: '14:00',
    duration: 30,
    type: 'FOLLOWUP',
    host: 'Sara M.',
    status: 'CONFIRMED',
    color: '#8B5CF6',
    hour: 14
  },
  {
    id: 5,
    title: 'Demo - Enterprise Plan',
    clientName: 'Noura Salem',
    date: '2026-02-20',
    time: '16:00',
    duration: 60,
    type: 'DEMO',
    host: 'Omar H.',
    status: 'PENDING',
    color: '#EC4899',
    hour: 16
  },
  {
    id: 6,
    title: 'Partnership Review',
    clientName: 'Yusuf Ahmed',
    date: '2026-02-21',
    time: '11:00',
    duration: 45,
    type: 'MEETING',
    host: 'Ahmed F.',
    status: 'CONFIRMED',
    color: '#14B8A6',
    hour: 11
  },
  {
    id: 7,
    title: 'Technical Onboarding',
    clientName: 'Layla M.',
    date: '2026-02-21',
    time: '09:00',
    duration: 120,
    type: 'CONSULTATION',
    host: 'Omar H.',
    status: 'CONFIRMED',
    color: '#3B82F6',
    hour: 9
  }
]);

const bookingPages = ref([
  { id: 1, name: '30-min Demo Call', duration: 30, type: 'One-on-One', bookings: 45, icon: 'ph:presentation-chart-bold', color: '#6366F1' },
  { id: 2, name: '60-min Consultation', duration: 60, type: 'One-on-One', bookings: 23, icon: 'ph:video-camera-bold', color: '#10B981' },
  { id: 3, name: '15-min Quick Chat', duration: 15, type: 'Round Robin', bookings: 89, icon: 'ph:chat-circle-bold', color: '#F59E0B' }
]);

const todayBookings = computed(() => bookings.value.filter(b => b.date === '2026-02-20').length);
const weekBookings = computed(() => bookings.value.length);
const noShowRate = ref(4.2);

const currentDateLabel = computed(() => {
  return currentDate.value.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
});

const formatHour = (h: number) => `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) : '-');

const getBookingsForHour = (hour: number) => bookings.value.filter(b => b.hour === hour && b.date === '2026-02-20');

const getBookingStatusType = (s: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const m: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    CONFIRMED: 'success',
    PENDING: 'warning',
    CANCELLED: 'danger',
    NO_SHOW: 'danger',
    COMPLETED: 'info'
  };
  return m[s] || 'info';
};

const navigateDay = (offset: number) => {
  const d = new Date(currentDate.value);
  d.setDate(d.getDate() + offset);
  currentDate.value = d;
};
const goToToday = () => {
  currentDate.value = new Date();
};

const openBooking = (b: any) => ElMessage.info(`Opening: ${b.title}`);
const confirmBooking = (b: any) => {
  b.status = 'CONFIRMED';
  ElMessage.success('Booking confirmed');
};
const cancelBooking = (b: any) => {
  b.status = 'CANCELLED';
  ElMessage.success('Booking cancelled');
};
const quickBook = (hour: number) => {
  newBooking.value.time = `${hour}:00`;
  showBookingDialog.value = true;
};
const copyBookingLink = (page: any) => {
  navigator.clipboard?.writeText(`https://book.example.com/${page.id}`);
  ElMessage.success('Link copied!');
};

const createBooking = () => {
  if (!newBooking.value.title) {
    ElMessage.warning('Title required');
    return;
  }
  ElMessage.success('Booking scheduled');
  showBookingDialog.value = false;
};

const createBookingPage = () => {
  if (!newPage.value.name) {
    ElMessage.warning('Page name required');
    return;
  }
  ElMessage.success('Booking page created');
  showBookingTypeDialog.value = false;
};
</script>
