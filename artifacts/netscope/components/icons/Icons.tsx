import React from 'react';
import Svg, { Path, Circle, Polyline, Line, Rect, Polygon } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const d = (p: IconProps) => ({
  size: p.size ?? 24,
  color: p.color ?? '#94A3B8',
  sw: p.strokeWidth ?? 2,
});

export const HouseIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Polyline points="9 22 9 12 15 12 15 22" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const RadarIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth={sw}/>
    <Path d="M12 12 L18.5 5.5" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={sw} strokeOpacity="0.4"/>
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} strokeOpacity="0.2"/>
  </Svg>
); };

export const WrenchIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const ShieldIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const GearIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={sw}/>
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const WifiIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12.55a11 11 0 0 1 14.08 0" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M1.42 9a16 16 0 0 1 21.16 0" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Circle cx="12" cy="20" r="1" fill={color}/>
  </Svg>
); };

export const WifiOffIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M5 12.55a11 11 0 0 1 5.17-2.39" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M10.71 5.05A16 16 0 0 1 22.56 9" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Circle cx="12" cy="20" r="1" fill={color}/>
  </Svg>
); };

export const CheckCircleIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Polyline points="22 4 12 14.01 9 11.01" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const XCircleIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw}/>
    <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const AlertTriangleIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const AlertCircleIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw}/>
    <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const InfoIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw}/>
    <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="12" y1="8" x2="12.01" y2="8" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const GlobeIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw}/>
    <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth={sw}/>
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={color} strokeWidth={sw}/>
  </Svg>
); };

export const ServerIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="8" rx="2" ry="2" stroke={color} strokeWidth={sw}/>
    <Rect x="2" y="14" width="20" height="8" rx="2" ry="2" stroke={color} strokeWidth={sw}/>
    <Line x1="6" y1="6" x2="6.01" y2="6" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="6" y1="18" x2="6.01" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const LaptopIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const SmartphoneIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke={color} strokeWidth={sw}/>
    <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const TvIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="7" width="20" height="15" rx="2" ry="2" stroke={color} strokeWidth={sw}/>
    <Polyline points="17 2 12 7 7 2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const CpuIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="6" height="6" stroke={color} strokeWidth={sw}/>
    <Rect x="2" y="2" width="20" height="20" rx="2" ry="2" stroke={color} strokeWidth={sw}/>
    <Line x1="9" y1="2" x2="9" y2="5" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="15" y1="2" x2="15" y2="5" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="9" y1="19" x2="9" y2="22" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="15" y1="19" x2="15" y2="22" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="2" y1="9" x2="5" y2="9" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="2" y1="15" x2="5" y2="15" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="19" y1="9" x2="22" y2="9" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="19" y1="15" x2="22" y2="15" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const ZapIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const ClockIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw}/>
    <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const DownloadIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Polyline points="7 10 12 15 17 10" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const UploadIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Polyline points="17 8 12 3 7 8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="12" y1="3" x2="12" y2="15" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const RefreshIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="23 4 23 10 17 10" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Polyline points="1 20 1 14 7 14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const SearchIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={sw}/>
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const ChevronRightIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const ChevronDownIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="6 9 12 15 18 9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const ChevronUpIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="18 15 12 9 6 15" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const XIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const CopyIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke={color} strokeWidth={sw}/>
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const ShareIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={sw}/>
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={sw}/>
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={sw}/>
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const LockIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth={sw}/>
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const UnlockIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth={sw}/>
    <Path d="M7 11V7a5 5 0 0 1 9.9-1" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const KeyIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const StarIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const CrownIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 20h20M5 20l-2-9 5 3 4-6 4 6 5-3-2 9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const BellIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const TrendingUpIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Polyline points="17 6 23 6 23 12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const TrendingDownIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Polyline points="17 18 23 18 23 12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const MapIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="8" y1="2" x2="8" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="16" y1="6" x2="16" y2="22" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const QrCodeIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" stroke={color} strokeWidth={sw}/>
    <Rect x="14" y="3" width="7" height="7" stroke={color} strokeWidth={sw}/>
    <Rect x="14" y="14" width="7" height="7" stroke={color} strokeWidth={sw}/>
    <Rect x="3" y="14" width="7" height="7" stroke={color} strokeWidth={sw}/>
    <Rect x="5" y="5" width="3" height="3" fill={color}/>
    <Rect x="16" y="5" width="3" height="3" fill={color}/>
    <Rect x="16" y="16" width="3" height="3" fill={color}/>
    <Rect x="5" y="16" width="3" height="3" fill={color}/>
  </Svg>
); };

export const LinkIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const EyeIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={sw}/>
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={sw}/>
  </Svg>
); };

export const EyeOffIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const RouterIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="14" width="20" height="7" rx="2" stroke={color} strokeWidth={sw}/>
    <Path d="M6 14V8M12 14V8M18 14V8" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M6 8a6 6 0 0 1 12 0" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="6" y1="18" x2="6.01" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="18" y1="18" x2="18.01" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const TerminalIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="4 17 10 11 4 5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="12" y1="19" x2="20" y2="19" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const HelpCircleIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw}/>
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
  </Svg>
); };

export const FilterIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const TrashIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="3 6 5 6 21 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const ArrowLeftIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12l7 7M5 12l7-7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const ActivityIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const BluetoothIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
); };

export const SignalIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 6l4.5 4.5" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M1 1l22 22" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M5 12.55a11 11 0 0 1 5.17-2.39" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M10.71 5.05A16 16 0 0 1 22.56 9" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    <Circle cx="12" cy="20" r="1" fill={color}/>
  </Svg>
); };

export const CellularIcon = (p: IconProps) => { const { size, color, sw } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="17" width="3" height="4" rx="1" fill={color} opacity="1"/>
    <Rect x="7" y="13" width="3" height="8" rx="1" fill={color} opacity="0.8"/>
    <Rect x="12" y="9" width="3" height="12" rx="1" fill={color} opacity="0.6"/>
    <Rect x="17" y="4" width="3" height="17" rx="1" fill={color} opacity="0.4"/>
  </Svg>
); };

export const GitHubIcon = (p: IconProps) => { const { size, color } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </Svg>
); };

export const TelegramIcon = (p: IconProps) => { const { size, color } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </Svg>
); };

export const InstagramIcon = (p: IconProps) => { const { size, color } = d(p); return (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.689.072-4.948 0-3.259-.014-3.667-.072-4.947-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227a3.81 3.81 0 0 1-.899 1.382 3.744 3.744 0 0 1-1.38.896c-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421a3.716 3.716 0 0 1-1.379-.899 3.644 3.644 0 0 1-.9-1.38c-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </Svg>
); };
