import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { UserData } from "../graphql/queries/getUserData";

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ProjectsGraphProps {
  data: UserData['progress'];
}

const ProjectsGraph: React.FC<ProjectsGraphProps> = ({ data }) => {
  const [chartOptions, setChartOptions] = useState<ApexOptions | null>(null);
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

export default ProjectsGraph;

