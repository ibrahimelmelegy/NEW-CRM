export interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  route?: string;
}

export interface Tour {
  id: string;
  name: string;
  steps: TourStep[];
}

const STORAGE_KEY = 'crm_completed_tours';

// Shared state (module-level so all consumers share the same refs)
const isActive = ref(false);
const currentTour = ref<Tour | null>(null);
const currentStepIndex = ref(0);
const completedTours = ref<string[]>([]);
const _initialized = ref(false);

// Pre-defined tours
const tours: Tour[] = [
  {
    id: 'welcome',
    name: 'Welcome Tour',
    steps: [
      {
        target: '.nav',
        title: 'Navigation',
        description: 'Use the sidebar to navigate between modules. You can collapse it for more space.',
        position: 'right'
      },
      {
        target: '.spotlight-btn',
        title: 'Spotlight Search',
        description: 'Press Alt+K or click here to quickly find anything — leads, deals, pages, or actions.',
        position: 'bottom'
      },
      {
        target: '.notification',
        title: 'Notifications',
        description: 'Stay updated with real-time alerts for deal changes, task assignments, and more.',
        position: 'bottom'
      },
      {
        target: '.profile-trigger',
        title: 'Your Profile',
        description: 'Access your profile settings and logout from here.',
        position: 'bottom'
      },
      {
        target: '.slot-content',
        title: "You're All Set!",
        description: 'Explore the CRM and discover powerful tools for managing your sales pipeline. Press ? anytime to see keyboard shortcuts.',
        position: 'top'
      }
    ]
  },
  {
    id: 'sales-pipeline',
    name: 'Sales Pipeline Tour',
    steps: [
      {
        target: '.slot-content',
        title: 'Sales Pipeline',
        description: 'Track your deals from first contact to close. Each stage represents a milestone in your sales process.',
        position: 'top',
        route: '/sales/deals'
      },
      {
        target: '.slot-content',
        title: 'Kanban View',
        description: 'Drag and drop deals between stages. See your entire pipeline at a glance.',
        position: 'top',
        route: '/sales/deals/kanban'
      },
      {
        target: '.slot-content',
        title: 'Analytics',
        description: 'Monitor win rates, conversion funnels, and team performance.',
        position: 'top',
        route: '/analytics'
      }
    ]
  },
  {
    id: 'productivity',
    name: 'Productivity Tour',
    steps: [
      {
        target: '.slot-content',
        title: 'War Room',
        description: 'Your mission control center with real-time KPIs, live deal alerts, and team pulse.',
        position: 'top',
        route: '/dashboard/war-room'
      },
      {
        target: '.slot-content',
        title: 'Theme Studio',
        description: 'Customize the CRM appearance with 10 color presets and fine-tune glass effects.',
        position: 'top',
        route: '/settings/theme-studio'
      },
      {
        target: '.slot-content',
        title: 'Gamification',
        description: 'Earn points, unlock achievements, and compete on the leaderboard!',
        position: 'top',
        route: '/gamification/leaderboard'
      }
    ]
  }
];

export function useOnboarding() {
  const router = useRouter();

  // Load completed tours from localStorage once
  function _loadFromStorage() {
    if (_initialized.value) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        completedTours.value = JSON.parse(saved);
      }
    } catch {
      completedTours.value = [];
    }
    _initialized.value = true;
  }

  function _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTours.value));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }

  // Initialize on mount
  onMounted(() => {
    _loadFromStorage();
  });

  const currentStep = computed<TourStep | null>(() => {
    if (!currentTour.value) return null;
    return currentTour.value.steps[currentStepIndex.value] ?? null;
  });

  const progress = computed(() => {
    if (!currentTour.value) return 0;
    return ((currentStepIndex.value + 1) / currentTour.value.steps.length) * 100;
  });

  const totalSteps = computed(() => currentTour.value?.steps.length ?? 0);

  const isLastStep = computed(() => {
    if (!currentTour.value) return false;
    return currentStepIndex.value >= currentTour.value.steps.length - 1;
  });

  function isTourCompleted(tourId: string): boolean {
    return completedTours.value.includes(tourId);
  }

  async function _navigateIfNeeded(step: TourStep): Promise<void> {
    if (!step.route) return;
    const route = useRoute();
    if (route.path !== step.route) {
      await router.push(step.route);
      // Allow time for the page to render after navigation
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }

  async function startTour(tourId: string) {
    const tour = tours.find(t => t.id === tourId);
    if (!tour) return;

    currentTour.value = tour;
    currentStepIndex.value = 0;
    isActive.value = true;

    // Navigate to the first step's route if needed
    const firstStep = tour.steps[0];
    if (firstStep) {
      await _navigateIfNeeded(firstStep);
    }
  }

  async function nextStep() {
    if (!currentTour.value) return;

    if (currentStepIndex.value < currentTour.value.steps.length - 1) {
      currentStepIndex.value++;
      const step = currentTour.value.steps[currentStepIndex.value];
      if (step) {
        await _navigateIfNeeded(step);
      }
    } else {
      completeTour();
    }
  }

  async function prevStep() {
    if (!currentTour.value) return;

    if (currentStepIndex.value > 0) {
      currentStepIndex.value--;
      const step = currentTour.value.steps[currentStepIndex.value];
      if (step) {
        await _navigateIfNeeded(step);
      }
    }
  }

  function skipTour() {
    isActive.value = false;
    currentTour.value = null;
    currentStepIndex.value = 0;
  }

  function completeTour() {
    if (currentTour.value && !completedTours.value.includes(currentTour.value.id)) {
      completedTours.value = [...completedTours.value, currentTour.value.id];
      _saveToStorage();
    }
    isActive.value = false;
    currentTour.value = null;
    currentStepIndex.value = 0;
  }

  function resetTours() {
    completedTours.value = [];
    _saveToStorage();
  }

  return {
    isActive,
    currentTour,
    currentStepIndex,
    currentStep,
    progress,
    totalSteps,
    isLastStep,
    completedTours,
    tours,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTours,
    isTourCompleted
  };
}
