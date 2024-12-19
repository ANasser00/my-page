import { useState } from "react";
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { UserData } from "../graphql/queries/getUserData";

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface XPProgressGraphProps {
  data?: UserData['transaction'];
}

const XPProgressGraph: React.FC<XPProgressGraphProps> = ({ data }) => {
  const [timeRange, setTimeRange] = useState('6m');

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('No XP data available');
    return null;
  }

  const filterDataByTimeRange = (data: UserData['transaction'], timeRange: string) => {
    const now = new Date();
    let fromDate: Date;

    switch (timeRange) {
      case '1m':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3m':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6m':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        fromDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    }

    return data.filter(item => new Date(item.createdAt) >= fromDate);
  };

  const filteredData = filterDataByTimeRange(data, timeRange);

  const chartData = filteredData.map(item => ({
    x: new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    y: item.amount,
  }));

  const totalXP = filteredData[filteredData.length - 1]?.amount || 0;

  const chartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 400,
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    grid: {
      borderColor: '#333',
    },
    xaxis: {
      type: 'category',
      labels: {
        style: {
          colors: '#a0aec0',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#a0aec0',
        },
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
      },
      y: {
        formatter: (value: number) => `${value} XP`,
      },
      x: {
        show: true,
        format: 'MMM dd',
      },
      marker: {
        show: true,
      },
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        const value = series[seriesIndex][dataPointIndex];
        const date = w.globals.labels[dataPointIndex];
        return (
          '<div class="custom-tooltip">' +
          '<span class="tooltip-date">' + date + '</span><br/>' +
          '<span class="tooltip-value">' + value + ' XP</span>' +
          '</div>'
        );
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
        options={chartOptions}
        series={[{ name: 'XP', data: chartData.map(dataPoint => dataPoint.y) }]}
        type="line"
        height={400}
      />
    </div>
  );
};

export default XPProgressGraph;

<style jsx>
{`
.custom-tooltip {
  background-color: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tooltip-date {
  font-weight: bold;
  color: #a0aec0;
}

.tooltip-value {
  color: #a78bfa;
}
`}
</style>

