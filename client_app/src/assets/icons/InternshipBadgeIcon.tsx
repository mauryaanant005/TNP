

const InternshipBadgeIcon = ({ size = 32, color = "currentColor" }) => (
  <svg
    width={size}
    height={size + 18}
    viewBox="0 0 64 82"
    fill="none"
    stroke={color}
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Badge outline */}
    <rect x="8" y="16" width="48" height="36" rx="4" />
    {/* Top tab */}
    <rect x="28" y="6" width="8" height="14" rx="2" />
    {/* User circle */}
    <circle cx="32" cy="34" r="6" />
    {/* User lines */}
    <line x1="32" y1="40" x2="32" y2="46" />
    <path d="M26 46c0-3.3 12-3.3 12 0" />
    {/* INHOUSE INTERNSHIP text */}
    <text
      x="32"
      y="66"
      textAnchor="middle"
      fontSize="8"
      fill={color}
      fontFamily="Arial, Helvetica, sans-serif"
      fontWeight="bold"
      letterSpacing="1"
    >
      INHOUSE
    </text>
    <text
      x="32"
      y="76"
      textAnchor="middle"
      fontSize="8"
      fill={color}
      fontFamily="Arial, Helvetica, sans-serif"
      fontWeight="bold"
      letterSpacing="1"
    >
      INTERNSHIP
    </text>
  </svg>
);

export default InternshipBadgeIcon; 