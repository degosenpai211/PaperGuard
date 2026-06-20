interface Props {
  score: number;
}

export default function ScoreGauge({ score }: Props) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const arc = 188; // longitud del semicírculo
  const filled = (score / 100) * arc;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="90" viewBox="0 0 160 90">
        {/* Track */}
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="13"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arc}`}
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
        <text x="80" y="78" textAnchor="middle" fontSize="26" fontWeight="700" fill={color}>
          {score}
        </text>
        <text x="80" y="92" textAnchor="middle" fontSize="10" fill="#9ca3af">
          / 100
        </text>
      </svg>
      <p className="text-xs text-gray-400 mt-1">Score global ponderado</p>
    </div>
  );
}
