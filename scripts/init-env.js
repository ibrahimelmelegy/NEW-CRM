const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const projectRoot = path.join(__dirname, '..');
const backendDir = path.join(projectRoot, 'leadify-backend-main');
const frontendDir = path.join(projectRoot, 'leadify-frontend-main');

const envs = [
  {
    name: 'Backend',
    example: path.join(backendDir, '.env.example'),
    target: path.join(backendDir, '.env')
  },
  {
    name: 'Frontend',
    example: path.join(frontendDir, '.env.example'), // Will create if not exists
    target: path.join(frontendDir, '.env'),
    defaultContent: 'API_BASE_URL=http://localhost:5000\nBASE_URL=http://localhost:3000\n'
  }
];

async function setup() {
  console.log('🚀 Starting HPT CRM Environment Setup...\n');

  for (const env of envs) {
    if (fs.existsSync(env.target)) {
      console.log(`✅ ${env.name} .env already exists.`);
      continue;
    }

    console.log(`📝 Setting up ${env.name} .env...`);
    
    let content = '';
    if (fs.existsSync(env.example)) {
      content = fs.readFileSync(env.example, 'utf8');
    } else if (env.defaultContent) {
      content = env.defaultContent;
      fs.writeFileSync(env.example, content); // Create example if missing
    }

    fs.writeFileSync(env.target, content);
    console.log(`✨ Created ${env.target} from template.`);
  }

  console.log('\n👍 Environment setup complete!');
  rl.close();
}

setup();
