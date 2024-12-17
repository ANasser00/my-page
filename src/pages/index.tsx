import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { getUserData, UserData } from "../graphql/queries/getUserData";
import dynamic from 'next/dynamic';



// SVG Graph Components
const XPProgressGraph = ({ data }: { data?: UserData['transaction'] }) => {
  const [timeRange, setTimeRange] = useState('6m');

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('No XP data available');
    return null;
  }

  // Filter data based on time range
  const filterDataByTimeRange = (data: any[], range: string) => {
    const now = new Date();
    const ranges = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
    };
    const daysToShow = ranges[range as keyof typeof ranges] || 180;
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToShow));
    return data.filter(item => new Date(item.createdAt) >= cutoffDate);
  };

  const filteredData = filterDataByTimeRange(data, timeRange);

  const chartData = filteredData.map(item => ({
    x: new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    y: item.amount,
  }));

  const maxXP = Math.max(...filteredData.map(item => item.amount)) || 0;
  const totalXP = filteredData[filteredData.length - 1]?.amount || 0;

  const chartOptions = {
    chart: {
      type: 'line',
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    markers: {
      size: 6, // Size of the hover dots
      colors: ['#A78BFA'], // Color of the dots
      strokeColors: '#8B5CF6', // Outline color of the dots
      strokeWidth: 2,
      hover: {
        size: 8, // Dot size when hovered
      },
    },
    colors: ['#A78BFA'],
    xaxis: {
      type: 'category',
      categories: chartData.map(dataPoint => dataPoint.x),
      labels: {
        style: {
          colors: '#A0AEC0',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#A0AEC0',
        },
      },
    },
    tooltip: {
      enabled: true, // Enable tooltips
      theme: 'dark', // Dark theme for tooltips
      style: {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
      },
      x: {
        show: true,
        format: 'MMM dd', // Format for x-axis values in tooltips
      },
      y: {
        formatter: (value: number) => `${value} XP`, // Customize y-axis tooltip values
      },
      marker: {
        show: true, // Show marker dots in tooltips
      },
    },
    grid: {
      borderColor: '#2D3748',
      strokeDashArray: 4,
    },
    dataLabels: {
      enabled: false,
    },
    title: {
      text: `Total XP: ${totalXP}`,
      align: 'left',
      style: {
        color: '#A0AEC0',
        fontSize: '14px',
      },
    },
  };
  
  

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">XP Progression</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">XP growth per day for the</span>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="bg-gray-700 text-white text-sm rounded-md px-2 py-1 border-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1m">last month</option>
            <option value="3m">last 3 months</option>
            <option value="6m">last 6 months</option>
            <option value="1y">last year</option>
          </select>
        </div>
      </div>

      <ReactApexChart
        options={chartOptions} as ApexOptions
        series={[{ name: 'XP', data: chartData.map(dataPoint => dataPoint.y) }]}
        type="line"
        height={400}
/>

    </div>
  );
};


const ReactApexChart = dynamic(() => import('react-apexcharts') as any, { ssr: false });

const ProjectsGraph = ({ data }: { data: UserData['progress'] }) => {
  const [chartOptions, setChartOptions] = useState<any>(null);
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const validProjects = data.filter(item => item && item.grade !== null);
      const passCount = validProjects.filter(item => item.grade >= 1).length;
      const failCount = validProjects.filter(item => item.grade < 1).length;

      setChartData([passCount, failCount]);

      setChartOptions({
        chart: {
          type: 'donut',
          background: 'transparent',
        },
        labels: ['Pass', 'Fail'],
        colors: ['#34D399', '#F87171'],
        legend: {
          position: 'bottom',
          labels: {
            colors: '#A0AEC0',
          },
        },
        tooltip: {
          enabled: true,
          theme: 'dark',
          y: {
            formatter: (value: number) => `${value} Projects`,
          },
        },
        plotOptions: {
          pie: {
            donut: {
              size: '60%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total',
                  formatter: () => `${passCount + failCount} Projects`,
                },
              },
            },
          },
        },
      });
    }
  }, [data]);

  if (!chartOptions || chartData.length === 0) return null;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Project Results</h3>
      <ReactApexChart
        options={chartOptions}
        series={chartData}
        type="donut"
        height={350}
      />
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

  const handleSignOut = () => {
    sessionStorage.clear(); // Clear session storage
    window.location.href = '/login'; // Redirect to login page
  };

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
        console.log('Fetched user data:', data); // Log the fetched user data
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
        console.log('Fetched skills data:', skillsResult); // Log the fetched skills data
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
  const xpData = userData.transaction || [];
  const totalXP = xpData.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome, {userData.user.firstName || 'User'}
          </h1>
          <button 
            onClick={handleSignOut} 
            className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
          >
            Sign Out
          </button>
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
            <XPProgressGraph data={xpData} />
            
            <ProjectsGraph data={userData.progress} />
            
            <SkillsChart data={skillsData} />
          </div>
        </div>
      </div>
    </div>
  );
};
