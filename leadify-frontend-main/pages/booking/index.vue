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
      <el-table :data="bookings" class="glass-table" stripe v-loading="loading">
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
        <el-button type="primary" :loading="submitting" @click="createBooking">Schedule</el-button>
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
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

// ---------- Color palette for booking types ----------
const TYPE_COLORS: Record<string, string> = {
  DEMO: '#6366F1',
  MEETING: '#10B981',
  CONSULTATION: '#F59E0B',
  FOLLOWUP: '#8B5CF6'
};
const FALLBACK_COLORS = ['#EC4899', '#14B8A6', '#3B82F6', '#EF4444', '#A855F7', '#F97316'];

function colorForBooking(type: string | undefined, index: number): string {
  if (type && TYPE_COLORS[type]) return TYPE_COLORS[type];
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// ---------- Helpers to compute hour & duration from HH:MM strings ----------
function parseHourFromTime(time: string): number {
  if (!time) return 0;
  const [hStr] = time.split(':');
  return parseInt(hStr, 10);
}

function computeDurationMinutes(start: string, end: string): number {
  if (!start || !end) return 30; // sensible default
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

// ---------- Map raw API booking to the shape the UI expects ----------
interface UIBooking {
  id: number;
  title: string;
  clientName: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  host: string;
  status: string;
  color: string;
  hour: number;
}

function mapBooking(raw: any, index: number): UIBooking {
  const type = raw.type || '';
  const clientName = raw.clientName || raw.client?.name || '';
  const host = raw.staff?.name || '';
  const startTime = raw.startTime || '';
  const endTime = raw.endTime || '';

  return {
    id: raw.id,
    title: type && clientName ? `${type} - ${clientName}` : type || clientName || `Booking #${raw.id}`,
    clientName,
    date: raw.date || '',
    time: startTime,
    duration: computeDurationMinutes(startTime, endTime),
    type,
    host,
    status: raw.status || 'PENDING',
    color: colorForBooking(type, index),
    hour: parseHourFromTime(startTime)
  };
}

// ---------- State ----------
const viewMode = ref('day');
const showBookingDialog = ref(false);
const showBookingTypeDialog = ref(false);
const currentDate = ref(new Date());
const loading = ref(false);
const submitting = ref(false);

const newBooking = ref({ title: '', clientName: '', date: '', time: '', duration: 30, type: 'MEETING', location: '', notes: '' });
const newPage = ref({ name: '', duration: 30, type: 'ONE_ON_ONE', buffer: 10 });

const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

const bookings = ref<UIBooking[]>([]);

const bookingPages = ref([
  { id: 1, name: '30-min Demo Call', duration: 30, type: 'One-on-One', bookings: 45, icon: 'ph:presentation-chart-bold', color: '#6366F1' },
  { id: 2, name: '60-min Consultation', duration: 60, type: 'One-on-One', bookings: 23, icon: 'ph:video-camera-bold', color: '#10B981' },
  { id: 3, name: '15-min Quick Chat', duration: 15, type: 'Round Robin', bookings: 89, icon: 'ph:chat-circle-bold', color: '#F59E0B' }
]);

// ---------- Date helpers ----------
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekRange(d: Date): { start: string; end: string } {
  const dayOfWeek = d.getDay(); // 0=Sun
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return { start: toDateString(startOfWeek), end: toDateString(endOfWeek) };
}

// ---------- Computed stats ----------
const todayBookings = computed(() => {
  const todayStr = toDateString(new Date());
  return bookings.value.filter(b => b.date === todayStr).length;
});

const weekBookings = computed(() => {
  const { start, end } = getWeekRange(new Date());
  return bookings.value.filter(b => b.date >= start && b.date <= end).length;
});

const noShowRate = computed(() => {
  const total = bookings.value.length;
  if (total === 0) return 0;
  const noShows = bookings.value.filter(b => b.status === 'NO_SHOW').length;
  return parseFloat(((noShows / total) * 100).toFixed(1));
});

const currentDateLabel = computed(() => {
  return currentDate.value.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
});

const formatHour = (h: number) => `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) : '-');

const getBookingsForHour = (hour: number) => {
  const dateStr = toDateString(currentDate.value);
  return bookings.value.filter(b => b.hour === hour && b.date === dateStr);
};

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

// ---------- API: Fetch bookings ----------
async function fetchBookings() {
  loading.value = true;
  try {
    const res = await useApiFetch('bookings?limit=500');
    if (res?.success) {
      const raw: any[] = res.body?.docs || res.body || [];
      bookings.value = raw.map((b, i) => mapBooking(b, i));
    } else {
      ElMessage.error(res?.message || 'Failed to load bookings');
    }
  } catch (e: any) {
    ElMessage.error('Failed to load bookings');
  } finally {
    loading.value = false;
  }
}

// ---------- API: Create booking ----------
const createBooking = async () => {
  if (!newBooking.value.clientName) {
    ElMessage.warning('Client name is required');
    return;
  }

  // Build startTime HH:MM from the time picker value
  let startTime = '';
  if (newBooking.value.time) {
    const t = newBooking.value.time;
    if (typeof t === 'string') {
      startTime = t;
    } else if (t instanceof Date) {
      startTime = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    }
  }

  // Compute endTime from startTime + duration
  let endTime = '';
  if (startTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    const totalMin = sh * 60 + sm + (newBooking.value.duration || 30);
    const eh = Math.floor(totalMin / 60);
    const em = totalMin % 60;
    endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  }

  // Build date as YYYY-MM-DD string
  let dateStr = '';
  if (newBooking.value.date) {
    const d = newBooking.value.date;
    if (typeof d === 'string') {
      dateStr = d;
    } else if (d instanceof Date) {
      dateStr = toDateString(d);
    }
  }

  const payload = {
    clientName: newBooking.value.clientName,
    date: dateStr,
    startTime,
    endTime,
    type: newBooking.value.type,
    notes: newBooking.value.notes
  };

  submitting.value = true;
  try {
    const res = await useApiFetch('bookings', 'POST', payload);
    if (res?.success) {
      ElMessage.success('Booking scheduled');
      showBookingDialog.value = false;
      // Reset form
      newBooking.value = { title: '', clientName: '', date: '', time: '', duration: 30, type: 'MEETING', location: '', notes: '' };
      // Refresh list
      await fetchBookings();
    } else {
      ElMessage.error(res?.message || 'Failed to create booking');
    }
  } catch (e: any) {
    ElMessage.error('Failed to create booking');
  } finally {
    submitting.value = false;
  }
};

// ---------- API: Confirm booking ----------
const confirmBooking = async (b: UIBooking) => {
  try {
    const res = await useApiFetch(`bookings/${b.id}`, 'PUT', { status: 'CONFIRMED' });
    if (res?.success) {
      b.status = 'CONFIRMED';
      ElMessage.success('Booking confirmed');
    } else {
      ElMessage.error(res?.message || 'Failed to confirm booking');
    }
  } catch (e: any) {
    ElMessage.error('Failed to confirm booking');
  }
};

// ---------- API: Cancel booking ----------
const cancelBooking = async (b: UIBooking) => {
  try {
    const res = await useApiFetch(`bookings/${b.id}`, 'PUT', { status: 'CANCELLED' });
    if (res?.success) {
      b.status = 'CANCELLED';
      ElMessage.success('Booking cancelled');
    } else {
      ElMessage.error(res?.message || 'Failed to cancel booking');
    }
  } catch (e: any) {
    ElMessage.error('Failed to cancel booking');
  }
};

const openBooking = (b: UIBooking) => ElMessage.info(`Opening: ${b.title}`);

const quickBook = (hour: number) => {
  newBooking.value.time = `${String(hour).padStart(2, '0')}:00`;
  newBooking.value.date = toDateString(currentDate.value);
  showBookingDialog.value = true;
};

const copyBookingLink = (page: any) => {
  navigator.clipboard?.writeText(`https://book.example.com/${page.id}`);
  ElMessage.success('Link copied!');
};

const createBookingPage = () => {
  if (!newPage.value.name) {
    ElMessage.warning('Page name required');
    return;
  }
  // Add locally (no backend endpoint for booking pages)
  const pageIcons = ['ph:presentation-chart-bold', 'ph:video-camera-bold', 'ph:chat-circle-bold', 'ph:calendar-bold'];
  const pageColors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];
  const nextId = bookingPages.value.length > 0 ? Math.max(...bookingPages.value.map(p => p.id)) + 1 : 1;
  bookingPages.value.push({
    id: nextId,
    name: newPage.value.name,
    duration: newPage.value.duration,
    type: newPage.value.type === 'ONE_ON_ONE' ? 'One-on-One' : newPage.value.type === 'GROUP' ? 'Group' : 'Round Robin',
    bookings: 0,
    icon: pageIcons[nextId % pageIcons.length],
    color: pageColors[nextId % pageColors.length]
  });
  ElMessage.success('Booking page created');
  showBookingTypeDialog.value = false;
  newPage.value = { name: '', duration: 30, type: 'ONE_ON_ONE', buffer: 10 };
};

// ---------- Init ----------
onMounted(() => {
  fetchBookings();
});
</script>
