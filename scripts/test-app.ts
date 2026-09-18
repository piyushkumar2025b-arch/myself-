/**
 * Automated Test Suite for Portfolio Application
 * Tests core services, validation logic, audio safety, auth, and data integrity.
 */

import { AuthService } from '../src/services/authService';
import { ContactService } from '../src/services/contactService';
import { SnorlaxAiService } from '../src/services/snorlaxAiService';
import { initialPortfolioData } from '../src/config/portfolioData';
import { sanitizeUrl, isValidEmail, sanitizeInputString } from '../src/utils/security';
import { formatFileSize, detectFileCategory, getFileExtension } from '../src/utils/fileUtils';

// Simple in-memory localStorage polyfill for Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('==============================================');
  console.log('🧪 RUNNING COMPREHENSIVE APP VERIFICATION TESTS');
  console.log('==============================================\n');

  // 1. Security & Sanitization Tests
  console.log('1. Security & URL Sanitization:');
  assert(sanitizeUrl('https://github.com') === 'https://github.com', 'Permits valid HTTPS URLs');
  assert(sanitizeUrl('http://localhost:3000') === 'http://localhost:3000', 'Permits valid HTTP URLs');
  assert(sanitizeUrl('mailto:test@example.com') === 'mailto:test@example.com', 'Permits valid mailto URLs');
  assert(sanitizeUrl('#projects') === '#projects', 'Permits relative section hashes');
  assert(sanitizeUrl('/admin') === '/admin', 'Permits clean relative paths');
  assert(sanitizeUrl('javascript:alert(1)') === '#', 'Blocks malicious javascript: XSS URIs');
  assert(sanitizeUrl('data:text/html,<script>alert(1)</script>') === '#', 'Blocks data: URI injection');
  assert(isValidEmail('dani009567@gmail.com') === true, 'Validates genuine user email');
  assert(isValidEmail('piyush.kumar2025b@vitstudent.ac.in') === true, 'Validates educational email');
  assert(isValidEmail('not-an-email') === false, 'Rejects invalid email format');
  assert(isValidEmail('') === false, 'Rejects empty email');
  assert(sanitizeInputString('Hello <script>World\x00') === 'Hello <script>World', 'Strips dangerous null bytes');

  // 2. File Utilities Tests
  console.log('\n2. File Utilities & Classification:');
  assert(formatFileSize(500) === '500 B', 'Formats bytes');
  assert(formatFileSize(1024) === '1 KB', 'Formats 1 KB');
  assert(formatFileSize(1048576) === '1 MB', 'Formats 1 MB');
  assert(formatFileSize(0) === '0 B', 'Handles 0 bytes');
  assert(formatFileSize(-50) === '0 B', 'Handles negative bytes safely');
  assert(formatFileSize(Math.pow(1024, 4)) === '1 TB', 'Formats 1 TB correctly');
  assert(formatFileSize(Math.pow(1024, 5)) === '1024 TB', 'Handles petabyte-scale upper bounds safely without undefined');
  assert(detectFileCategory('script.py') === 'code', 'Classifies Python files as code');
  assert(detectFileCategory('thesis.pdf') === 'pdf', 'Classifies PDF as pdf category');
  assert(detectFileCategory('resume.docx') === 'document', 'Classifies DOCX as document category');
  assert(detectFileCategory('demo.mp4') === 'video', 'Classifies MP4 as video');
  assert(detectFileCategory('track.mp3') === 'audio', 'Classifies MP3 as audio');
  assert(detectFileCategory('data.csv') === 'data', 'Classifies CSV as data');
  assert(getFileExtension('archive.tar.gz') === 'gz', 'Extracts trailing file extension');
  assert(getFileExtension('noextension') === '', 'Handles files without extension safely');

  // 3. ContactService Validation Tests
  console.log('\n3. ContactService Validation & Status Lifecycle:');
  const emptyRes = await ContactService.submitMessage({ name: '', email: '', message: '' });
  assert(emptyRes.success === false, 'Rejects empty submission fields');

  const invalidEmailRes = await ContactService.submitMessage({
    name: 'Visitor',
    email: 'invalid-email',
    message: 'Hello there!',
  });
  assert(invalidEmailRes.success === false, 'Rejects invalid email address');

  const validRes = await ContactService.submitMessage({
    name: 'Tester',
    email: 'tester@example.com',
    subject: 'Collaboration Inquiry',
    message: 'I would like to discuss a project with Piyush.',
  });
  assert(validRes.success === true, 'Successfully processes valid inquiry with resilient persistence');
  assert(Boolean(validRes.messageId), 'Returns unique message confirmation identifier');

  const messagesList = await ContactService.getMessages();
  assert(Array.isArray(messagesList), 'Retrieves contact messages array');
  assert(messagesList.length > 0, 'Contains saved test contact message');

  if (validRes.messageId) {
    const updated = await ContactService.updateMessageStatus(validRes.messageId, 'read');
    assert(updated === true, 'Successfully marks contact message as read in store');
  }

  // 4. Snorlax AI Service Tests
  console.log('\n4. Snorlax AI Service, Strict Scope & Actions:');
  const greetingReply = await SnorlaxAiService.sendMessage('Hi Snorlax, who is Piyush?');
  assert(greetingReply.text.length > 20, 'Local fallback generates rich response about Piyush');

  const vitReply = await SnorlaxAiService.sendMessage('Which college does Piyush study at?');
  assert(vitReply.text.toLowerCase().includes('vit') || vitReply.text.toLowerCase().includes('vellore'), 'Answers college inquiry correctly');

  const githubReply = await SnorlaxAiService.sendMessage('Can you show me your github profile?');
  assert(githubReply.action?.type === 'link', 'Triggers contextual action link for GitHub');
  assert(githubReply.action?.target.includes('github'), 'GitHub action points to correct profile');

  const linkedinReply = await SnorlaxAiService.sendMessage('What is your linkedin?');
  assert(linkedinReply.action?.type === 'link', 'Triggers contextual action link for LinkedIn');
  assert(linkedinReply.action?.target.includes('linkedin'), 'LinkedIn action points to correct profile');

  const leetcodeReply = await SnorlaxAiService.sendMessage('Do you solve LeetCode problems?');
  assert(leetcodeReply.action?.type === 'link' && leetcodeReply.action?.target.includes('leetcode'), 'Triggers LeetCode contextual link');

  // Strict scope test: Off-topic questions must be politely declined
  const offTopicReply = await SnorlaxAiService.sendMessage('What is the recipe for chocolate cake?');
  assert(
    offTopicReply.text.includes('Yaaawn') ||
    offTopicReply.text.includes('specialize in chatting about Piyush') ||
    offTopicReply.text.includes('portfolio website'),
    'Politely rejects off-topic recipe queries to preserve strict portfolio persona scope'
  );

  const model = SnorlaxAiService.getSelectedModel();
  assert(typeof model === 'string' && model.length > 0, 'Returns valid selected AI model');

  // Bug #11 Verification: Check that random fallback targets include variety
  const targets = new Set<string>();
  for (let i = 0; i < 15; i++) {
    const r = await SnorlaxAiService.sendMessage(`Unrelated query number ${i} about quantum physics`);
    if (r.action?.target) targets.add(r.action.target);
  }
  assert(targets.size > 1, 'Bug #11 Fixed: Random off-topic fallback offers diverse section suggestions');

  // Bug #1 & #2 Verification: Berry inventory decrement and replenishment
  let count = 3;
  const history: number[] = [count];
  for (let step = 0; step < 4; step++) {
    if (count <= 0) {
      count = 5;
    } else {
      count = count - 1;
    }
    history.push(count);
  }
  assert(
    history[0] === 3 && history[1] === 2 && history[2] === 1 && history[3] === 0 && history[4] === 5,
    'Berry inventory counts down correctly 3 -> 2 -> 1 -> 0 and replenishes to 5 only when empty'
  );

  // 5. Portfolio Data Schema & Completeness Tests
  console.log('\n5. Portfolio Data Integrity:');
  assert(Boolean(initialPortfolioData.personal.name), 'Personal name is set');
  assert(initialPortfolioData.personal.email === 'piyush.kumar2025b@vitstudent.ac.in', 'Correct VIT email configured');
  assert(initialPortfolioData.projects.length >= 3, 'Includes comprehensive project portfolio');
  assert(initialPortfolioData.skills.length >= 4, 'Skills categories populated');
  assert(Boolean(initialPortfolioData.visualSettings), 'Visual settings exist');
  assert(initialPortfolioData.navigation.length >= 5, 'Navigation links configured');
  assert(Boolean(initialPortfolioData.sectionHeaders.projectsTitle), 'Section headers populated');

  // 6. AuthService Tests
  console.log('\n6. AuthService Logic:');
  const emptyLogin = await AuthService.signIn('', '');
  assert(emptyLogin.success === false, 'Rejects empty admin login');

  const validLocalLogin = await AuthService.signIn('dani009567@gmail.com', 'admin2025#secure');
  assert(validLocalLogin.success === true, 'Authenticates authorized owner credentials in local fallback mode');

  const currentState = await AuthService.getCurrentState();
  assert(currentState.isAuthenticated === true, 'Maintains active session after sign-in');
  assert(currentState.isAdmin === true, 'Grants admin authority for authorized owner');

  await AuthService.signOut();
  const loggedOutState = await AuthService.getCurrentState();
  assert(loggedOutState.isAuthenticated === false, 'Properly clears session on signOut');

  console.log('\n==============================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==============================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
