// icons.jsx — Small set of stroked icons, sized via prop

const Ico = ({ d, size = 22, sw = 1.8, fill = 'none', stroke = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const ICO = {
  pos:       (p) => <Ico {...p} d={<><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 14h4M14 14h3"/></>}/>,
  inventory: (p) => <Ico {...p} d={<><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></>}/>,
  restock:   (p) => <Ico {...p} d={<><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></>}/>,
  dashboard: (p) => <Ico {...p} d={<><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></>}/>,
  reports:   (p) => <Ico {...p} d={<><path d="M4 19V5M4 19h16M8 14v3M12 9v8M16 12v5M20 6v11"/></>}/>,
  scan:      (p) => <Ico {...p} d={<><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M7 8v8M10 8v8M13 8v8M17 8v8"/></>}/>,
  qrCam:     (p) => <Ico {...p} d={<><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><rect x="7" y="7" width="4" height="4" rx="1"/><rect x="13" y="7" width="4" height="4" rx="1"/><rect x="7" y="13" width="4" height="4" rx="1"/><path d="M13 13h4M13 17h4"/></>}/>,
  cash:      (p) => <Ico {...p} d={<><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 9v0M19 15v0"/></>}/>,
  bank:      (p) => <Ico {...p} d={<><path d="M3 21h18M5 21V10M19 21V10M3 10l9-6 9 6M9 21v-7M15 21v-7"/></>}/>,
  qr:        (p) => <Ico {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v3M14 21h7M21 17v4"/></>}/>,
  printer:   (p) => <Ico {...p} d={<><rect x="6" y="3" width="12" height="6" rx="1"/><path d="M4 9h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2v3H6v-3H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z"/><path d="M8 14h8"/></>}/>,
  trash:     (p) => <Ico {...p} d={<><path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6"/></>}/>,
  plus:      (p) => <Ico {...p} d={<><path d="M12 5v14M5 12h14"/></>}/>,
  minus:     (p) => <Ico {...p} d={<><path d="M5 12h14"/></>}/>,
  check:     (p) => <Ico {...p} d={<><path d="M4 12.5 10 18 20 6"/></>}/>,
  x:         (p) => <Ico {...p} d={<><path d="M6 6l12 12M18 6 6 18"/></>}/>,
  search:    (p) => <Ico {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>}/>,
  bag:       (p) => <Ico {...p} d={<><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></>}/>,
  alert:     (p) => <Ico {...p} d={<><path d="M12 3 2 21h20L12 3z"/><path d="M12 10v5M12 18v.01"/></>}/>,
  egg:       (p) => <Ico {...p} d={<><path d="M12 3c4 0 7 6 7 11a7 7 0 1 1-14 0c0-5 3-11 7-11z"/></>}/>,
  trendUp:   (p) => <Ico {...p} d={<><path d="M3 17l6-6 4 4 8-9"/><path d="M14 6h7v7"/></>}/>,
  download:  (p) => <Ico {...p} d={<><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></>}/>,
  filter:    (p) => <Ico {...p} d={<><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>}/>,
  back:      (p) => <Ico {...p} d={<><path d="M15 18l-6-6 6-6"/></>}/>,
  flash:     (p) => <Ico {...p} d={<><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></>}/>,
  bell:      (p) => <Ico {...p} d={<><path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16l-2-3z"/><path d="M10 21a2 2 0 0 0 4 0"/></>}/>,
  user:      (p) => <Ico {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>}/>,
  edit:      (p) => <Ico {...p} d={<><path d="M4 20h4l11-11-4-4L4 16v4z"/></>}/>,
  history:   (p) => <Ico {...p} d={<><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/><path d="M12 7v6l4 2"/></>}/>,
};

window.ICO = ICO;
