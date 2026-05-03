import * as Linking from 'expo-linking';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

const REPO = 'https://github.com/mkr-infinity/NetScope';

async function getDeviceInfo(): Promise<string> {
  let networkType = 'Unknown';
  try {
    const state = await Network.getNetworkStateAsync();
    networkType = state.type || 'Unknown';
  } catch {}
  return [
    `App Version: ${Application.nativeApplicationVersion || 'Unknown'}`,
    `OS Version: ${Platform.OS === 'android' ? `Android ${Platform.Version}` : Device.osVersion || 'Unknown'}`,
    `Device Model: ${Device.modelName || 'Unknown'}`,
    `Network Type: ${networkType}`,
  ].join('\n');
}

export async function openBugReport(): Promise<void> {
  const deviceInfo = await getDeviceInfo();
  const body = encodeURIComponent(`## Bug Description\n<!-- Describe what happened clearly -->\n\n\n## Steps to Reproduce\n1.\n2.\n3.\n\n## Expected Behavior\n<!-- What should have happened? -->\n\n## Actual Behavior\n<!-- What actually happened? -->\n\n## Device Info (auto-filled)\n\`\`\`\n${deviceInfo}\n\`\`\`\n\n## Additional Context\n<!-- Any other context -->`);
  const title = encodeURIComponent('[Bug] ');
  const labels = encodeURIComponent('bug');
  await Linking.openURL(`${REPO}/issues/new?title=${title}&body=${body}&labels=${labels}`);
}

export async function openFeatureRequest(): Promise<void> {
  const body = encodeURIComponent(`## Feature Description\n<!-- What feature would you like? -->\n\n## Use Case\n<!-- Why would this be useful? -->\n\n## Priority\n- [ ] Nice to have\n- [ ] Important\n- [ ] Critical`);
  const title = encodeURIComponent('[Feature Request] ');
  const labels = encodeURIComponent('enhancement');
  await Linking.openURL(`${REPO}/issues/new?title=${title}&body=${body}&labels=${labels}`);
}

export function openPlayStore(): void {
  Linking.openURL('https://play.google.com/store/apps/details?id=com.mkrinfinity.netscope');
}

export function openBuyMeACoffee(): void {
  Linking.openURL('https://buymeacoffee.com/mkr_infinity');
}

export function openGitHub(): void {
  Linking.openURL('https://github.com/mkr-infinity');
}

export function openWebsite(): void {
  Linking.openURL('https://mkr-infinity.github.io');
}

export function openInstagram(): void {
  Linking.openURL('https://instagram.com/mkr_infinity');
}

export function openTelegram(): void {
  Linking.openURL('https://t.me/mkr_infinity');
}
