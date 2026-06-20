interface Props {
  score: number;
}

export default function ScoreGauge({ score }: Props) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const arc = 188;
  const filled = (score / 100) * arc;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="180" height="105" viewBox="0 0 180 105" className="drop-shadow-lg">
          {/* Track background */}
          <path
            d="M 20 90 A 70 70 0 0 1 160 90"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Filled arc with animation */}
          <path
            d="M 20 90 A 70 70 0 0 1 160 90"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${arc}`}
            style={{ 
              transition: "stroke-dasharray 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              filter: `drop-shadow(0 0 8px ${color}40)`
            }}
          />
          {/* Score text */}
          <text x="90" y="88" textAnchor="middle" fontSize="32" fontWeight="700" fill={color} className="drop-shadow">
            {score}
          </text>
          <text x="90" y="104" textAnchor="middle" fontSize="11" fill="#9ca3af" fontWeight="500">
            / 100
          </text>
        </svg>
      </div>
      <p className="text-xs text-gray-500 font-medium mt-3">Score global ponderado</p>
    </div>
  );
}
