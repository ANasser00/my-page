import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { getUserData, UserData } from "../graphql/queries/getUserData";

// SVG Graph Components
const XPProgressGraph = ({ data }: { data?: UserData['xp_view'] }) => {
  const [timeRange, setTimeRange] = useState('6m');
  const isDark = true;

  if (!data) {
    console.log('No XP data available');
    return null;
  }

  const xpData = Array.isArray(data) ? data : [];
  if (xpData.length === 0) {
    console.log('XP data is empty');
    return null;
  }

  // Filter data based on time range
  const filterDataByTimeRange = (data: any[], range: string) => {
    const now = new Date();
    const ranges = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365
    };
    const daysToShow = ranges[range as keyof typeof ranges] || 180;
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToShow));
    return data.filter(item => new Date(item.createdAt) >= cutoffDate);
  };

  const filteredData = filterDataByTimeRange(xpData, timeRange);
  const maxXP = Math.max(...filteredData.map(item => item.amount));
  const totalXP = filteredData[filteredData.length - 1]?.amount || 0;
  const width = 600;
  const height = 300;
  const padding = 40;

  // Calculate points for the line
  const points = filteredData.map((item, index) => {
    const x = padding + (index * (width - 2 * padding)) / (filteredData.length - 1);
    const y = height - padding - ((item.amount / maxXP) * (height - 2 * padding));
    return { x, y, amount: item.amount, date: new Date(item.createdAt) };
  });

  // Create the line path
  const linePath = points.map((point, index) => 
    (index === 0 ? 'M' : 'L') + `${point.x},${point.y}`
  ).join(' ');

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">XP Progression</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">XP growth per day for the</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-700 text-white text-sm rounded-md px-2 py-1 border-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1m">last month</option>
            <option value="3m">last 3 months</option>
            <option value="6m">last 6 months</option>
            <option value="1y">last year</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <svg width={width} height={height} className="w-full h-auto">
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[...Array(5)].map((_, i) => {
            const y = padding + (i * (height - 2 * padding) / 4);
            return (
              <line
                key={`grid-${i}`}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#374151"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Line path */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            className="transition-all duration-1000"
          >
            <animate
              attributeName="stroke-dasharray"
              from={`${width * 2} ${width * 2}`}
              to={`${width * 2} 0`}
              dur="1.5s"
              fill="freeze"
            />
          </path>

          {/* Data points */}
          {points.map((point, index) => (
            <g key={`point-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="#8B5CF6"
                className="transition-all duration-300"
              >
                <title>
                  {`${point.amount.toLocaleString()} XP\n${point.date.toLocaleDateString()}`}
                </title>
              </circle>
            </g>
          ))}

          {/* X-axis labels */}
          {points.filter((_, i) => i % Math.ceil(points.length / 6) === 0).map((point, i) => (
            <text
              key={`label-${i}`}
              x={point.x}
              y={height - padding + 20}
              textAnchor="middle"
              className="text-xs fill-gray-400"
            >
              {point.date.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
            </text>
          ))}

          {/* Y-axis labels */}
          {[...Array(5)].map((_, i) => {
            const value = maxXP * (1 - i / 4);
            return (
              <text
                key={`y-label-${i}`}
                x={padding - 10}
                y={padding + (i * (height - 2 * padding) / 4)}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-xs fill-gray-400"
              >
                {Math.round(value).toLocaleString()}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-purple-500 mr-2"></div>
            <span className="text-sm text-gray-400">Your XP</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-gray-500 mr-2"></div>
            <span className="text-sm text-gray-400">All students</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectsGraph = ({ data }: { data: UserData['progress'] }) => {
  const [viewMode, setViewMode] = useState<'all' | 'pass' | 'fail'>('all');
  const isDark = true;
  
  const width = 300;
  const height = 300;
  const radius = Math.min(width, height) / 3;
  const centerX = width / 2;
  const centerY = height / 2;

  const passProjects = data.filter(item => item.grade >= 1);
  const failProjects = data.filter(item => item.grade < 1);
  const passCount = passProjects.length;
  const failCount = failProjects.length;
  const total = passCount + failCount;

  const getDisplayData = () => {
    switch(viewMode) {
      case 'pass':
        return passProjects;
      case 'fail':
        return failProjects;
      default:
        return data;
    }
  };

  const passAngle = (passCount / total) * 360;
  const failAngle = (failCount / total) * 360;

  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, -startAngle);
    const end = polarToCartesian(centerX, centerY, radius, -endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const displayData = getDisplayData();
  const averageGrade = displayData.length > 0 
    ? (displayData.reduce((sum, item) => sum + item.grade, 0) / displayData.length).toFixed(2)
    : "0.00";

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Project Results</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 rounded-md text-sm transition-all duration-200 ${
              viewMode === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setViewMode('pass')}
            className={`px-3 py-1 rounded-md text-sm transition-all duration-200 ${
              viewMode === 'pass'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Passes
          </button>
          <button
            onClick={() => setViewMode('fail')}
            className={`px-3 py-1 rounded-md text-sm transition-all duration-200 ${
              viewMode === 'fail'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Fails
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <svg width={width} height={height} className="w-full h-auto">
          <g className="transform transition-transform duration-500 ease-in-out">
            {viewMode === 'all' && (
              <>
                <path
                  d={createArc(0, passAngle)}
                  fill="#34D399"
                  className="transition-all duration-500"
                >
                  <animate
                    attributeName="opacity"
                    from="0"
                    to="1"
                    dur="0.5s"
                    fill="freeze"
                  />
                </path>
                <path
                  d={createArc(passAngle, 360)}
                  fill="#F87171"
                  className="transition-all duration-500"
                >
                  <animate
                    attributeName="opacity"
                    from="0"
                    to="1"
                    dur="0.5s"
                    fill="freeze"
                  />
                </path>
              </>
            )}
            {viewMode === 'pass' && (
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="#34D399"
                className="transition-all duration-500"
              >
                <animate
                  attributeName="r"
                  from="0"
                  to={radius}
                  dur="0.5s"
                  fill="freeze"
                />
              </circle>
            )}
            {viewMode === 'fail' && (
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="#F87171"
                className="transition-all duration-500"
              >
                <animate
                  attributeName="r"
                  from="0"
                  to={radius}
                  dur="0.5s"
                  fill="freeze"
                />
              </circle>
            )}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius / 2}
              fill="#1F2937"
              className="transition-all duration-500"
            >
              <animate
                attributeName="r"
                from="0"
                to={radius / 2}
                dur="0.5s"
                fill="freeze"
              />
            </circle>
          </g>
        </svg>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div className="bg-gray-900/50 p-3 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
            <span className="text-gray-300">Pass</span>
          </div>
          <div className="text-emerald-400 font-semibold">{passCount} Projects</div>
          {viewMode === 'pass' && (
            <div className="text-gray-400 text-xs mt-1">Avg Grade: {averageGrade}</div>
          )}
        </div>
        <div className="bg-gray-900/50 p-3 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-gray-300">Fail</span>
          </div>
          <div className="text-red-400 font-semibold">{failCount} Projects</div>
          {viewMode === 'fail' && (
            <div className="text-gray-400 text-xs mt-1">Avg Grade: {averageGrade}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Skill Chart Component
const SkillsChart = ({ data }: { data: any }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw spider web
    const skills = data.transaction || [];
    const numSkills = skills.length;
    if (numSkills === 0) return;

    const angleStep = (Math.PI * 2) / numSkills;

    // Draw web lines
    for (let i = 0; i < 5; i++) {
      const webRadius = ((i + 1) / 5) * radius;
      ctx.beginPath();
      for (let j = 0; j <= numSkills; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = centerX + webRadius * Math.cos(angle);
        const y = centerY + webRadius * Math.sin(angle);
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = '#374151';
      ctx.stroke();
    }

    // Draw skill lines
    for (let i = 0; i < numSkills; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      );
      ctx.strokeStyle = '#374151';
      ctx.stroke();

      // Add skill labels
      const labelRadius = radius + 20;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      ctx.fillStyle = '#D1D5DB';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(skills[i].type.replace('skill_', '').toUpperCase(), x, y);
    }

    // Draw skill values
    ctx.beginPath();
    skills.forEach((skill: any, i: number) => {
      const angle = i * angleStep - Math.PI / 2;
      const value = skill.amount / 100; // Normalize the value
      const x = centerX + radius * value * Math.cos(angle);
      const y = centerY + radius * value * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(
      centerX + radius * (skills[0].amount / 100) * Math.cos(-Math.PI / 2),
      centerY + radius * (skills[0].amount / 100) * Math.sin(-Math.PI / 2)
    );
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#3B82F6';
    ctx.stroke();
  }, [data]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">Skills Overview</h3>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="w-full h-auto"
      ></canvas>
    </div>
  );
};

// Draggable Section Component
const DraggableSection = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart.current) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  return (
    <div
      className={`relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: isDragging ? 1000 : 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {children}
    </div>
  );
};

// Helper function for pie chart
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [skillsData, setSkillsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        const data = await getUserData(token);
        setUserData(data);

        // Fetch skills data
        const response = await fetch(
          "https://learn.reboot01.com/api/graphql-engine/v1/graphql",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `
                query {
                  transaction(
                    where: {
                      _and: [
                        { type: { _iregex: "(^|[^[:alnum:]_])[[:alnum:]_]*skill_[[:alnum:]_]*($|[^[:alnum:]_])" } },
                        { type: { _like: "%skill%" } },
                        { object: { type: { _eq: "project" } } },
                        {
                          type: {
                            _in: [
                              "skill_go",
                              "skill_js",
                              "skill_html",
                              "skill_css",
                              "skill_unix",
                              "skill_docker",
                              "skill_sql",
                              "skill_technologies"
                            ]
                          }
                        }
                      ]
                    }
                    order_by: [{ type: asc }, { createdAt: desc }]
                    distinct_on: type
                  ) {
                    amount
                    type
                  }
                }
              `,
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to fetch skills data');
        const skillsResult = await response.json();
        setSkillsData(skillsResult.data);

      } catch (err: any) {
        console.error('Error in fetchData:', err);
        setError(err.message || "Failed to fetch data");
        if (err.message?.toLowerCase().includes('unauthorized')) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="text-blue-500 hover:text-blue-700"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  if (!userData) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">No user data available</p>
    </div>
  );

  // Safely calculate total XP
  const xpData = userData.xp_view || [];
  const totalXP = xpData.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome, {userData.user.firstName || 'User'}
          </h1>
          
          {/* User Details Box */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-gray-400 text-sm">Personal Info</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-white">
                      <span className="text-gray-400">Name: </span>
                      {userData.user.firstName} {userData.user.lastName}
                    </p>
                    <p className="text-white">
                      <span className="text-gray-400">Email: </span>
                      {userData.user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-gray-400 text-sm">Account Details</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-white">
                      <span className="text-gray-400">ID: </span>
                      {userData.user.id}
                    </p>
                    <p className="text-white">
                      <span className="text-gray-400">Login: </span>
                      {userData.user.login}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-gray-400 text-sm">Additional Info</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-white">
                      <span className="text-gray-400">Campus: </span>
                      {userData.user.campus}
                    </p>
                    <p className="text-white">
                      <span className="text-gray-400">Member Since: </span>
                      {new Date(userData.user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <DraggableSection id="xp-progress">
              <XPProgressGraph data={xpData} />
            </DraggableSection>
            
            <DraggableSection id="project-results">
              <ProjectsGraph data={userData.progress} />
            </DraggableSection>
            
            <DraggableSection id="skills">
              <SkillsChart data={skillsData} />
            </DraggableSection>
          </div>
        </div>
      </div>
    </div>
  );
};
