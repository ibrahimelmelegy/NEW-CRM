const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 8888;
const TEST_RESULTS_FILE = 'test-results.json';
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Arabic Error Mapping Strategy
const ERROR_STRATEGIES = [
  { keywords: ['401', 'Unauthorized', 'token'], msg: 'مشكلة في المصادقة: تحقق من التوكن وصلاحيات الرول' },
  { keywords: ['500', 'Internal Server Error'], msg: 'خطأ في السيرفر: تحقق من الـ API Logs واتصال قاعدة البيانات' },
  { keywords: ['404', 'Not Found'], msg: 'المسار غير موجود: تأكد من الرابط (API Endpoint) أو الملف' },
  { keywords: ['Network', 'fetch', 'ECONNREFUSED'], msg: 'خطأ في الشبكة: تأكد أن السيرفر (Backend) يعمل على المنفذ الصحيح' },
  { keywords: ['Element not found', 'Cannot find element', 'null'], msg: 'خطأ واجهة: العنصر غير موجود، تحقق من الـ v-if والـ CSS classes' },
  { keywords: ['undefined', 'reading', 'property'], msg: 'خطأ برمجي: تحاول قراءة خاصية من متغير غير معرف (undefined)' },
  { keywords: ['timeout', 'timed out'], msg: 'انتهت المهلة: العملية استغرقت وقتاً طويلاً جداً' }
];

function getArabicStrategy(errorMsg) {
  if (!errorMsg) return 'خطأ غير معروف';
  for (const strategy of ERROR_STRATEGIES) {
    if (strategy.keywords.some(k => errorMsg.includes(k))) {
      return strategy.msg;
    }
  }
  return 'خطأ تقني: راجع الرسالة الأصلية للمزيد من التفاصيل';
}

let latestTestData = null;

function updateTestData() {
  const resultsPath = path.join(PROJECT_ROOT, TEST_RESULTS_FILE);
  try {
    if (fs.existsSync(resultsPath)) {
      // Read file synchronously to avoid rendering half-written files
      // In a real app we might want debouncing or file locking check
      const content = fs.readFileSync(resultsPath, 'utf8');
      if (content.trim()) {
        latestTestData = JSON.parse(content);
        // console.log('Updated test data from file');
      }
    }
  } catch (e) {
    // console.error("Waiting for test results...", e.message);
  }
}

function runTests() {
  console.log('Starting Vitest in WATCH mode... (UI will be at http://localhost:51204)');
  console.log('Creating Arabic Dashboard at http://localhost:8888');

  // Use spawn to keep the process alive
  // npx vitest --reporter=json --outputFile=test-results.json
  // Note: By default 'vitest' is in watch mode.
  // We add --ui to explicitly ensure the UI starts too.
  const vitest = spawn('npx', ['vitest', '--ui', '--reporter=json', '--outputFile=' + TEST_RESULTS_FILE], {
    cwd: PROJECT_ROOT,
    shell: true,
    stdio: 'inherit'
  });

  vitest.on('error', err => {
    console.error('Failed to start vitest subprocess:', err);
  });

  // Watch for file changes to clean/update dashboard
  const resultsPath = path.join(PROJECT_ROOT, TEST_RESULTS_FILE);

  // Initial check
  updateTestData();

  // Poll for changes (fs.watch can be flaky on some systems/editors)
  setInterval(updateTestData, 2000);

  generateAndServeDashboard();
}

function generateAndServeDashboard() {
  const server = http.createServer((req, res) => {
    // Re-process data on every request to ensure freshness
    const failedTests = [];
    let passedCount = 0;
    let failedCount = 0;
    let isRunning = latestTestData === null;

    if (latestTestData && latestTestData.testResults) {
      latestTestData.testResults.forEach(suite => {
        suite.assertionResults.forEach(result => {
          if (result.status === 'failed') {
            failedCount++;
            const formattedError = result.failureMessages.join('\n');
            failedTests.push({
              file: suite.name,
              name: result.title,
              error: formattedError,
              arabicFix: getArabicStrategy(formattedError)
            });
          } else {
            passedCount++;
          }
        });
      });
      isRunning = false;
    }

    const isHealthy = failedCount === 0 && passedCount + failedCount > 0;
    const statusText = isRunning ? 'Running Tests... ⏳' : isHealthy ? 'Healthy ✅' : 'Critical ❌';
    const statusColor = isRunning ? '#3b82f6' : isHealthy ? '#10b981' : '#ef4444';

    // HTML Template
    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRM Health Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 900px; mx-auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
        .status-badge { padding: 10px 20px; border-radius: 50px; color: white; font-weight: bold; font-size: 1.2rem; background: ${statusColor}; }
        h1 { margin: 0; color: #1e293b; }
        .stats { display: flex; gap: 20px; margin-bottom: 30px; }
        .stat-card { flex: 1; padding: 20px; background: #f1f5f9; border-radius: 15px; text-align: center; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #334155; }
        .stat-label { color: #64748b; }
        
        .error-card { background: #fff0f0; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .error-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 10px; color: #991b1b; }
        .error-tech { font-family: monospace; background: white; padding: 10px; border-radius: 8px; font-size: 0.9rem; overflow-x: auto; color: #dc2626; margin-bottom: 15px; direction: ltr; text-align: left; }
        .fix-strategy { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 8px; color: #047857; font-weight: bold; display: flex; align-items: center; gap: 10px; }
        .icon { font-size: 1.2rem; }
        
        .empty-state { text-align: center; padding: 50px; color: #94a3b8; }
        .vitest-link { text-align: center; margin-top: 20px; }
        .vitest-link a { color: #3b82f6; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 CRM System Health Dashboard</h1>
            <div class="status-badge">${statusText}</div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${passedCount + failedCount}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #10b981">${passedCount}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #ef4444">${failedCount}</div>
                <div class="stat-label">Failed</div>
            </div>
        </div>

        <h2>Failed Components / الأخطاء المكتشفة</h2>
        
        ${
          failedTests.length === 0
            ? '<div class="empty-state"><h3>🎉 النظام يعمل بكفاءة! لا توجد أخطاء.</h3></div>'
            : failedTests
                .map(
                  f => `
                <div class="error-card">
                    <div class="error-header">
                        <span>📄 ${f.file}</span>
                        <span>${f.name}</span>
                    </div>
                    <div class="error-tech">${f.error}</div>
                    <div class="fix-strategy">
                        <span class="icon">💡</span>
                        <span>استراتيجية الحل: ${f.arabicFix}</span>
                    </div>
                </div>
            `
                )
                .join('')
        }

        <div class="vitest-link">
             👉 <a href="http://localhost:51204/__vitest__/" target="_blank">افتح Vitest UI التفصيلي (Live Console)</a>
        </div>
    </div>
    <script>
        // Auto-refresh every 5 seconds to catch live updates
        setTimeout(() => window.location.reload(), 5000);
    </script>
</body>
</html>
        `;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  server.listen(PORT, () => {
    console.log(`\n✅ Arabic Health Dashboard is live at: http://localhost:${PORT}`);
    // Attempt to open browser
    const start = process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open';
    try {
      require('child_process').exec(start + ' http://localhost:' + PORT);
    } catch (e) {}
  });
}

// Start
runTests();
