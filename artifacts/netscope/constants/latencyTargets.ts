export interface LatencyTarget {
  name: string;
  url: string;
  icon: string;
  color: string;
}

export const LATENCY_TARGETS: LatencyTarget[] = [
  { name: 'Google',     url: 'https://www.gstatic.com/generate_204', icon: 'globe',    color: '#4285F4' },
  { name: 'Cloudflare', url: 'https://1.1.1.1',                      icon: 'shield',   color: '#F38020' },
  { name: 'Discord',    url: 'https://discord.com',                  icon: 'zap',      color: '#5865F2' },
  { name: 'Netflix',    url: 'https://fast.com',                     icon: 'play',     color: '#E50914' },
  { name: 'GitHub',     url: 'https://github.com',                   icon: 'code',     color: '#24292F' },
  { name: 'Amazon',     url: 'https://amazon.com',                   icon: 'shopping', color: '#FF9900' },
  { name: 'Microsoft',  url: 'https://microsoft.com',                icon: 'grid',     color: '#0078D4' },
  { name: 'YouTube',    url: 'https://youtube.com',                  icon: 'play2',    color: '#FF0000' },
  { name: 'Twitter/X',  url: 'https://x.com',                       icon: 'twitter',  color: '#1DA1F2' },
  { name: 'Twitch',     url: 'https://twitch.tv',                   icon: 'tv',       color: '#9146FF' },
];
