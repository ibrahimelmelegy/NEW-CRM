<template>
  <div class="min-h-screen bg-[#0f172a] text-slate-200 p-6 lg:p-10 font-sans selection:bg-cyan-500/30">
    <header
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 bg-slate-800/40 backdrop-blur-md p-8 rounded-3xl border border-slate-700/50 shadow-2xl"
    >
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="h-10 w-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <span class="material-icons text-white">verified_user</span>
          </div>
          <h1 class="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            HPT CRM | QA COMMAND CENTER
          </h1>
        </div>
        <p class="text-slate-400 font-medium ml-1 flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          Next-Gen Automated Testing Intelligence
        </p>
      </div>

      <button
class="group relative overflow-hidden bg-slate-700 hover:bg-cyan-600 px-8 py-3 rounded-2xl font-bold transition-all duration-300 border border-slate-600 hover:border-cyan-400 flex items-center gap-3 shadow-xl active:scale-95" 
        @click="loadTestData"
      >
        <span class="material-icons group-hover:rotate-180 transition-transform duration-500">sync</span>
        <span>REFRESH DATA</span>
      </button>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div class="bg-slate-800/60 p-7 rounded-[2rem] border border-slate-700 hover:border-blue-500/50 transition-all duration-500 group shadow-lg">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
            <span class="material-icons">inventory_2</span>
          </div>
          <span class="text-[10px] font-bold tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md uppercase">Total Scope</span>
        </div>
        <p class="text-slate-400 text-xs font-bold uppercase tracking-tighter">Total Scenarios</p>
        <p class="text-5xl font-black text-white mt-1">{{ stats.total }}</p>
      </div>

      <div class="bg-slate-800/60 p-7 rounded-[2rem] border border-slate-700 hover:border-emerald-500/50 transition-all duration-500 group shadow-lg">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
            <span class="material-icons">task_alt</span>
          </div>
          <span class="text-[10px] font-bold tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase">Success</span>
        </div>
        <p class="text-slate-400 text-xs font-bold uppercase tracking-tighter">Passed Tests</p>
        <p class="text-5xl font-black text-emerald-400 mt-1">{{ stats.passed }}</p>
      </div>

      <div class="bg-slate-800/60 p-7 rounded-[2rem] border border-slate-700 hover:border-rose-500/50 transition-all duration-500 group shadow-lg">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-rose-500/10 rounded-2xl text-rose-400 group-hover:scale-110 transition-transform">
            <span class="material-icons">error_outline</span>
          </div>
          <span class="text-[10px] font-bold tracking-widest text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md uppercase">Attention</span>
        </div>
        <p class="text-slate-400 text-xs font-bold uppercase tracking-tighter">Failed Tests</p>
        <p class="text-5xl font-black text-rose-500 mt-1">{{ stats.failed }}</p>
      </div>

      <div class="bg-slate-800/60 p-7 rounded-[2rem] border border-slate-700 hover:border-amber-500/50 transition-all duration-500 group shadow-lg">
        <div class="flex justify-between items-start mb-4">
          <div class="p-3 bg-amber-500/10 rounded-2xl text-amber-400 group-hover:scale-110 transition-transform">
            <span class="material-icons">query_stats</span>
          </div>
          <span class="text-[10px] font-bold tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md uppercase">Integrity</span>
        </div>
        <p class="text-slate-400 text-xs font-bold uppercase tracking-tighter">Health Score</p>
        <p class="text-5xl font-black text-amber-400 mt-1">
          {{ stats.successRate }}
          <span class="text-2xl opacity-50">%</span>
        </p>
      </div>
    </div>

    <div
      v-if="error"
      class="animate-pulse bg-rose-500/10 border border-rose-500/50 text-rose-200 p-6 rounded-3xl mb-8 flex items-center justify-between shadow-2xl backdrop-blur-sm"
    >
      <div class="flex items-center gap-4">
        <span class="material-icons text-rose-500 text-3xl">cloud_off</span>
        <div>
          <h3 class="font-black text-lg">SYNCING FAILURE</h3>
          <p class="text-sm opacity-80 uppercase tracking-widest font-medium">
            Result matrix not detected. Initiating automated test run is recommended.
          </p>
        </div>
      </div>
      <button
        class="bg-rose-500 hover:bg-rose-600 px-6 py-2 rounded-xl font-bold text-white transition-all shadow-lg active:scale-90"
        @click="loadTestData"
      >
        RETRY SYNC
      </button>
    </div>

    <div class="bg-slate-800/30 rounded-[2.5rem] border border-slate-700/50 shadow-3xl overflow-hidden backdrop-blur-xl">
      <div class="px-8 py-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/20">
        <div class="flex items-center gap-3">
          <span class="material-icons text-cyan-400">terminal</span>
          <h2 class="text-xl font-black uppercase tracking-tight">Execution Log</h2>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-full border border-slate-700">
          <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last Update:</span>
          <span class="text-[10px] text-cyan-400 font-mono font-bold">{{ lastUpdate }}</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-800/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-black">
            <tr>
              <th class="px-10 py-5">Scenario Title</th>
              <th class="px-8 py-5">Status</th>
              <th class="px-8 py-5 text-center">Latency</th>
              <th class="px-10 py-5">System Output / Error Log</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/30">
            <tr v-for="test in tests" :key="test.id" class="hover:bg-slate-700/20 transition-all group">
              <td class="px-10 py-6">
                <div class="flex items-center gap-3">
                  <div
                    class="h-2 w-2 rounded-full"
                    :class="test.status === 'passed' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'"
                  ></div>
                  <span class="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">{{ test.title }}</span>
                </div>
              </td>
              <td class="px-8 py-6">
                <span
:class="test.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'" 
                  "
                  class="px-4 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-widest"
                >
                  {{ test.status }}
                </span>
              </td>
              <td class="px-8 py-6 text-center text-slate-400 font-mono text-sm tracking-tighter">{{ test.duration }}ms</td>
              <td class="px-10 py-6">
                <div class="flex items-center gap-2 max-w-sm">
                  <span v-if="test.error" class="material-icons text-rose-500 text-sm">warning</span>
                  <p class="text-xs font-medium italic" :class="test.error ? 'text-rose-400/80' : 'text-slate-500'" :title="test.error">
                    {{ test.error || 'Smooth execution, no anomalies detected.' }}
                  </p>
                </div>
              </td>
            </tr>
            <tr v-if="tests.length === 0">
              <td colspan="4" class="px-10 py-24 text-center">
                <div class="flex flex-col items-center gap-4 opacity-30">
                  <span class="material-icons text-7xl">biotech</span>
                  <p class="text-lg font-bold uppercase tracking-[0.3em]">Awaiting Simulation Data...</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
// Security: Open access for local development
definePageMeta({
  auth: false
});

const lastUpdate = ref('-');
const tests = ref([]);
const error = ref(false);
const stats = reactive({ total: 0, passed: 0, failed: 0, successRate: 0 });

const loadTestData = async () => {
  try {
    error.value = false;
    // Using fetch with cache-busting timestamp
    const response = await fetch('/_test_results/results.json?t=' + Date.now());
    if (!response.ok) throw new Error('Simulation Data Missing');

    const resultsData = await response.json();
    processResults(resultsData);
    lastUpdate.value = new Date().toLocaleTimeString();
  } catch (e) {
    console.error('Dashboard Engine: Waiting for simulation matrix...', e);
    error.value = true;
  }
};

const processResults = data => {
  const allTests = [];
  let passedCount = 0;

  if (!data.suites) return;

  data.suites.forEach(suite => {
    suite.specs.forEach(spec => {
      spec.tests.forEach(testRun => {
        const result = testRun.results[0];
        allTests.push({
          id: spec.id + '-' + Math.random().toString(36).substr(2, 9),
          title: spec.title,
          status: result.status,
          duration: result.duration,
          error: result.error?.message
        });
        if (result.status === 'passed') passedCount++;
      });
    });
  });

  tests.value = allTests;
  stats.total = allTests.length;
  stats.passed = passedCount;
  stats.failed = allTests.length - passedCount;
  stats.successRate = allTests.length > 0 ? ((passedCount / allTests.length) * 100).toFixed(1) : 0;
};

onMounted(() => {
  loadTestData();
  // Automated background polling every 30 seconds
  setInterval(loadTestData, 30000);
});
</script>

<style scoped>
/* Custom Scrollbar for Luxury Look */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #0f172a;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 10px;
  border: 2px solid #0f172a;
}
::-webkit-scrollbar-thumb:hover {
  background: #06b6d4;
}
</style>
