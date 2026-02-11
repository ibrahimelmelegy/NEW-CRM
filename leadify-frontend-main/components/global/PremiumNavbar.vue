<template lang="pug">
.premium-navbar
  .navbar-glass-container
    //- Left Section - Logo & Brand
    .navbar-left
      .brand-section
        img.logo(src="/images/logo-shape.png" alt="Logo" @click="$router.push('/')")
        .brand-divider
        .brand-info
          span.brand-name High Point
          span.brand-subtitle CRM System

    //- Center Section - Search (Optional)
    .navbar-center
      .search-container
        Icon.search-icon(name="ph:magnifying-glass-bold" size="18")
        input.search-input(
          type="text"
          placeholder="Search anything..."
          v-model="searchQuery"
          @focus="isSearchFocused = true"
          @blur="isSearchFocused = false"
        )
        kbd.search-shortcut(v-if="!searchQuery") Ctrl+K

    //- Right Section - Actions & Profile
    .navbar-right
      //- Language Selector
      el-dropdown.navbar-item(trigger="click" @command="handleLanguageChange")
        .nav-button.language-btn
          Icon(name="ph:translate-bold" size="20")
          span.btn-label {{ currentLocale.toUpperCase() }}
          Icon.dropdown-arrow(name="ph:caret-down-bold" size="12")
        template(#dropdown)
          el-dropdown-menu.glass-dropdown
            el-dropdown-item(command="en")
              .dropdown-item-content
                Icon(name="circle-flags:us" size="20")
                span English
                Icon.check-icon(name="ph:check-bold" v-if="currentLocale === 'en'" size="16")
            el-dropdown-item(command="ar")
              .dropdown-item-content
                Icon(name="circle-flags:sa" size="20")
                span العربية
                Icon.check-icon(name="ph:check-bold" v-if="currentLocale === 'ar'" size="16")

      //- Theme Toggle
      .navbar-item
        .nav-button.theme-btn(@click="toggleTheme")
          transition(name="fade" mode="out-in")
            Icon(
              v-if="isDarkMode"
              name="ph:sun-bold"
              size="20"
              key="sun"
            )
            Icon(
              v-else
              name="ph:moon-bold"
              size="20"
              key="moon"
            )

      //- Notifications
      .navbar-item
        el-badge.notification-badge(:value="unreadCount" :hidden="unreadCount === 0" :max="99")
          .nav-button.notifications-btn(@click="showNotifications = !showNotifications")
            Icon(name="ph:bell-bold" size="20")

      //- Apps Menu
      el-dropdown.navbar-item(trigger="click")
        .nav-button.apps-btn
          Icon(name="ph:squares-four-bold" size="20")
        template(#dropdown)
          el-dropdown-menu.glass-dropdown.apps-menu
            .apps-grid
              .app-item(v-for="app in apps" :key="app.name" @click="$router.push(app.link)")
                .app-icon(:style="{ background: app.color }")
                  Icon(:name="app.icon" size="24")
                span.app-name {{ app.name }}

      //- Divider
      .navbar-divider

      //- User Profile
      el-dropdown.navbar-item(trigger="click" @command="handleProfileCommand")
        .nav-button.profile-btn
          el-avatar.profile-avatar(:size="36" :src="user?.avatar")
            Icon(name="ph:user-bold" size="20")
          .profile-info(v-if="!isMobile")
            span.profile-name {{ user?.name || 'System Admin' }}
            span.profile-role {{ user?.role || 'Administrator' }}
          Icon.dropdown-arrow(name="ph:caret-down-bold" size="12")
        template(#dropdown)
          el-dropdown-menu.glass-dropdown.profile-menu
            .profile-header
              el-avatar.profile-avatar-large(:size="56" :src="user?.avatar")
                Icon(name="ph:user-bold" size="28")
              .profile-header-info
                strong {{ user?.name || 'System Admin' }}
                span.profile-email {{ user?.email || 'admin@highpoint.com' }}
            el-dropdown-item(command="profile" divided)
              Icon.menu-icon(name="ph:user-circle-bold" size="18")
              span My Profile
            el-dropdown-item(command="settings")
              Icon.menu-icon(name="ph:gear-bold" size="18")
              span Settings
            el-dropdown-item(command="help")
              Icon.menu-icon(name="ph:question-bold" size="18")
              span Help Center
            el-dropdown-item(command="logout" divided)
              Icon.menu-icon(name="ph:sign-out-bold" size="18")
              span Logout

  //- Notifications Drawer
  transition(name="slide-left")
    .notifications-drawer(v-if="showNotifications" @click.self="showNotifications = false")
      .drawer-glass-panel
        .drawer-header
          h3 Notifications
          .header-actions
            el-button(text @click="markAllAsRead")
              Icon(name="ph:checks-bold" size="18")
              span Mark all read
            el-button.close-btn(text @click="showNotifications = false")
              Icon(name="ph:x-bold" size="20")

        .drawer-content
          .notification-item(
            v-for="notification in notifications"
            :key="notification.id"
            :class="{ unread: !notification.read }"
            @click="handleNotificationClick(notification)"
          )
            .notification-icon(:style="{ background: notification.color }")
              Icon(:name="notification.icon" size="20")
            .notification-body
              .notification-title {{ notification.title }}
              .notification-message {{ notification.message }}
              .notification-time {{ formatTime(notification.time) }}
            .notification-actions(v-if="!notification.read")
              .unread-indicator
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'

const router = useRouter()
const { locale } = useI18n()

// State
const searchQuery = ref('')
const isSearchFocused = ref(false)
const showNotifications = ref(false)
const isDarkMode = ref(true)
const isMobile = ref(false)

// User data
const user = ref({
  name: 'System Admin',
  email: 'admin@highpoint.com',
  role: 'Administrator',
  avatar: '/images/avatar.png'
})

// Current locale
const currentLocale = computed(() => locale.value || 'en')

// Notifications
const unreadCount = ref(5)
const notifications = ref([
  {
    id: 1,
    title: 'New Lead Assigned',
    message: 'Ahmed Hassan has been assigned to you',
    time: new Date(Date.now() - 5 * 60000),
    icon: 'ph:user-plus-bold',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    read: false
  },
  {
    id: 2,
    title: 'Deal Closed',
    message: 'Congratulations! Deal #1234 has been closed',
    time: new Date(Date.now() - 15 * 60000),
    icon: 'ph:check-circle-bold',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    read: false
  },
  {
    id: 3,
    title: 'Meeting Reminder',
    message: 'Team standup in 15 minutes',
    time: new Date(Date.now() - 30 * 60000),
    icon: 'ph:calendar-bold',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    read: false
  }
])

// Apps menu
const apps = [
  { name: 'Dashboard', icon: 'ph:house-bold', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', link: '/' },
  { name: 'Sales', icon: 'ph:chart-line-up-bold', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', link: '/sales' },
  { name: 'Projects', icon: 'ph:folders-bold', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', link: '/operations/projects' },
  { name: 'Procurement', icon: 'ph:shopping-cart-bold', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', link: '/procurement' },
  { name: 'Reports', icon: 'ph:chart-bar-bold', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', link: '/reports' },
  { name: 'Settings', icon: 'ph:gear-bold', color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', link: '/settings' }
]

// Methods
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('light-mode')
  ElNotification({
    title: isDarkMode.value ? 'Dark Mode' : 'Light Mode',
    message: `Switched to ${isDarkMode.value ? 'dark' : 'light'} mode`,
    type: 'success',
    duration: 2000
  })
}

const handleLanguageChange = (lang: string) => {
  locale.value = lang
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  ElNotification({
    title: 'Language Changed',
    message: `Switched to ${lang === 'ar' ? 'العربية' : 'English'}`,
    type: 'success',
    duration: 2000
  })
}

const handleProfileCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'help':
      window.open('https://help.highpoint.com', '_blank')
      break
    case 'logout':
      // Add logout logic here
      ElNotification({
        title: 'Logged Out',
        message: 'You have been logged out successfully',
        type: 'success'
      })
      router.push('/login')
      break
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
  unreadCount.value = 0
  ElNotification({
    title: 'Done',
    message: 'All notifications marked as read',
    type: 'success',
    duration: 2000
  })
}

const handleNotificationClick = (notification: any) => {
  notification.read = true
  unreadCount.value = notifications.value.filter(n => !n.read).length
  // Navigate based on notification type
}

const formatTime = (date: Date) => {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// Lifecycle
onMounted(() => {
  isMobile.value = window.innerWidth < 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })

  // Keyboard shortcut for search (Ctrl+K)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      document.querySelector('.search-input')?.focus()
    }
  })
})
</script>

<style lang="scss" scoped>
.premium-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  z-index: 1000;
  padding: 0 var(--spacing-lg);

  // Glass effect navbar
  .navbar-glass-container {
    @include mica-material;
    height: 100%;
    border-radius: var(--radius-large);
    border: 1px solid var(--color-border-default);
    box-shadow: var(--elevation-shadow-8);
    padding: 0 var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    position: relative;
    overflow: hidden;

    // Shine effect
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--color-border-strong), transparent);
      animation: shine 3s infinite;
    }
  }

  // Left Section
  .navbar-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);

    .brand-section {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);

      .logo {
        height: 40px;
        width: auto;
        cursor: pointer;
        transition: var(--transition-button);

        &:hover {
          transform: scale(1.05);
        }
      }

      .brand-divider {
        width: 1px;
        height: 32px;
        background: var(--color-border-default);
      }

      .brand-info {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .brand-name {
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          line-height: 1;
        }

        .brand-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          line-height: 1;
        }
      }
    }
  }

  // Center Section - Search
  .navbar-center {
    flex: 1;
    max-width: 600px;
    margin: 0 auto;

    .search-container {
      position: relative;
      width: 100%;

      .search-icon {
        position: absolute;
        left: var(--spacing-md);
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-text-tertiary);
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        height: 42px;
        padding: 0 var(--spacing-lg) 0 calc(var(--spacing-md) + 28px);
        background: var(--color-neutral-background-2);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-large);
        color: var(--color-text-primary);
        font-size: var(--font-size-sm);
        transition: all var(--duration-fast) var(--curve-standard);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-alpha-10);
          background: var(--color-neutral-background-1);
        }

        &::placeholder {
          color: var(--color-text-disabled);
        }
      }

      .search-shortcut {
        position: absolute;
        right: var(--spacing-md);
        top: 50%;
        transform: translateY(-50%);
        padding: 2px 8px;
        background: var(--color-neutral-background-3);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-small);
        font-size: 11px;
        color: var(--color-text-tertiary);
        font-family: var(--font-family-mono);
        pointer-events: none;
      }
    }
  }

  // Right Section
  .navbar-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);

    .navbar-item {
      display: flex;
      align-items: center;
    }

    .navbar-divider {
      width: 1px;
      height: 32px;
      background: var(--color-border-default);
      margin: 0 var(--spacing-xs);
    }

    .nav-button {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      height: 42px;
      padding: 0 var(--spacing-md);
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-medium);
      color: var(--color-text-primary);
      cursor: pointer;
      transition: all var(--duration-fast) var(--curve-standard);
      position: relative;

      &:hover {
        background: var(--color-surface-hover);
        border-color: var(--color-border-subtle);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }

      .btn-label {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .dropdown-arrow {
        opacity: 0.6;
        transition: transform var(--duration-fast);
      }

      &.profile-btn {
        gap: var(--spacing-sm);

        .profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;

          .profile-name {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--color-text-primary);
            line-height: 1;
          }

          .profile-role {
            font-size: 11px;
            color: var(--color-text-tertiary);
            line-height: 1;
          }
        }
      }
    }

    .notification-badge {
      :deep(.el-badge__content) {
        background: var(--color-danger);
        border: 2px solid var(--color-neutral-background-1);
        font-size: 10px;
        font-weight: var(--font-weight-bold);
      }
    }
  }
}

// Glass Dropdown
:deep(.glass-dropdown) {
  @include mica-material;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-large);
  box-shadow: var(--elevation-shadow-16);
  padding: var(--spacing-xs);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  min-width: 200px;

  .el-dropdown-menu__item {
    border-radius: var(--radius-medium);
    padding: var(--spacing-sm) var(--spacing-md);
    margin: 2px 0;
    color: var(--color-text-secondary);
    transition: all var(--duration-fast);

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-text-primary);
    }

    .dropdown-item-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);

      .check-icon {
        margin-left: auto;
        color: var(--color-primary);
      }
    }

    .menu-icon {
      margin-right: var(--spacing-sm);
      opacity: 0.7;
    }
  }
}

// Profile Menu
.profile-menu {
  min-width: 280px !important;

  .profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-lg);
    gap: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border-subtle);
    margin-bottom: var(--spacing-xs);

    .profile-avatar-large {
      box-shadow: var(--elevation-shadow-4);
      border: 3px solid var(--color-neutral-background-1);
    }

    .profile-header-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-align: center;

      strong {
        font-size: var(--font-size-md);
        color: var(--color-text-primary);
      }

      .profile-email {
        font-size: var(--font-size-xs);
        color: var(--color-text-tertiary);
      }
    }
  }
}

// Apps Menu
.apps-menu {
  min-width: 360px !important;

  .apps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);

    .app-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-md);
      border-radius: var(--radius-medium);
      cursor: pointer;
      transition: all var(--duration-fast);

      &:hover {
        background: var(--color-surface-hover);
        transform: translateY(-2px);

        .app-icon {
          transform: scale(1.1);
          box-shadow: var(--elevation-shadow-8);
        }
      }

      .app-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-large);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: all var(--duration-fast);
        box-shadow: var(--elevation-shadow-4);
      }

      .app-name {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
        text-align: center;
      }
    }
  }
}

// Notifications Drawer
.notifications-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2000;
  background: var(--color-surface-overlay);
  backdrop-filter: blur(4px);

  .drawer-glass-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 420px;
    @include mica-material;
    border-left: 1px solid var(--color-border-default);
    box-shadow: var(--elevation-shadow-64);
    display: flex;
    flex-direction: column;

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-xl);
      border-bottom: 1px solid var(--color-border-subtle);

      h3 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: var(--spacing-xs);
      }
    }

    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-md);

      .notification-item {
        display: flex;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border-radius: var(--radius-medium);
        cursor: pointer;
        transition: all var(--duration-fast);
        position: relative;

        &:hover {
          background: var(--color-surface-hover);
        }

        &.unread {
          background: var(--color-surface-selected);

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 80%;
            background: var(--color-primary);
            border-radius: var(--radius-small);
          }
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: var(--radius-medium);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .notification-body {
          flex: 1;

          .notification-title {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--color-text-primary);
            margin-bottom: 4px;
          }

          .notification-message {
            font-size: var(--font-size-xs);
            color: var(--color-text-secondary);
            margin-bottom: 6px;
          }

          .notification-time {
            font-size: 11px;
            color: var(--color-text-tertiary);
          }
        }

        .notification-actions {
          display: flex;
          align-items: center;

          .unread-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--color-primary);
          }
        }
      }
    }
  }
}

// Animations
@keyframes shine {
  0% {
    left: -100%;
  }
  50%, 100% {
    left: 100%;
  }
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all var(--duration-normal) var(--curve-emphasized);
}

.slide-left-enter-from,
.slide-left-leave-to {
  opacity: 0;

  .drawer-glass-panel {
    transform: translateX(100%);
  }
}

// Responsive
@media (max-width: 768px) {
  .premium-navbar {
    padding: 0 var(--spacing-sm);

    .navbar-glass-container {
      padding: 0 var(--spacing-sm);
      gap: var(--spacing-sm);
    }

    .navbar-center {
      display: none;
    }

    .navbar-right {
      .nav-button {
        padding: 0 var(--spacing-sm);

        .btn-label {
          display: none;
        }
      }
    }
  }

  .notifications-drawer .drawer-glass-panel {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .premium-navbar {
    .navbar-left {
      .brand-info {
        display: none;
      }

      .brand-divider {
        display: none;
      }
    }
  }
}
</style>
