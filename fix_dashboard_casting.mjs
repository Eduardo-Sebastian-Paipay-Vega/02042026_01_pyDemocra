import { readFileSync, writeFileSync } from 'fs';

const FILE = 'ong/src/app/pages/Dashboard.tsx';
let content = readFileSync(FILE, 'utf8');
const original = content;

content = content.replace(/actionErrors\.startAt/g, '(actionErrors as any).startAt');
content = content.replace(/actionErrors\.endAt/g, '(actionErrors as any).endAt');
content = content.replace(/hoursDetail\.hours/g, '(hoursDetail as any).hours');
content = content.replace(/hoursDetail\.comment/g, '(hoursDetail as any).comment');
content = content.replace(/hourDetail\.hours/g, '(hourDetail as any).hours');
content = content.replace(/hourDetail\.comment/g, '(hourDetail as any).comment');
content = content.replace(/hourDetail\.approvalId/g, '(hourDetail as any).approvalId');
content = content.replace(/activityDetail\.assignedVolunteersCount/g, '(activityDetail as any).assignedVolunteersCount');
content = content.replace(/activityDetail\.projectId/g, '(activityDetail as any).projectId');

if (content !== original) {
  writeFileSync(FILE, content, 'utf8');
  console.log(`Fixed: ${FILE}`);
} else {
  console.log(`No changes needed in ${FILE}`);
}
