/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import "./Charts";

interface PlacementChartProps {
  data: {
    [year: string]: Record<string, number>;
  };
}

export function PlacementChart({ data }: PlacementChartProps) {
  const years = Object.keys(data);
  const branches = Object.keys(data[years[0]]);

  const chartData = {
    labels: years,
    datasets: branches.map((branch, index) => ({
      label: branch,
      data: years.map((year) => data[year][branch]),
      borderColor:
        index === 0 ? "rgba(139, 92, 246, 1)" : "rgba(244, 63, 94, 1)",
      backgroundColor:
        index === 0 ? "rgba(139, 92, 246, 0.2)" : "rgba(244, 63, 94, 0.2)",
      tension: 0.4,
      fill: true,
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Placement Rate (%)",
        },
      },
    },
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Placement Trends</h3>
      <Line data={chartData} options={options} />
    </Card>
  );
}
