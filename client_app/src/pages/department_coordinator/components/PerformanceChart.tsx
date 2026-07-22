/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
import { Bar } from "react-chartjs-2";
import "./Charts";

interface PerformanceChartProps {
  academicPerformance: Record<string, number>;
  trainingPerformance: Record<string, number>;
}

export function PerformanceChart({
  academicPerformance,
  trainingPerformance,
}: PerformanceChartProps) {
  const data = {
    labels: ["Academic", "Training"],
    datasets: [
      {
        label: "Performance",
        data: [academicPerformance.FE, trainingPerformance.FE],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Performance: ${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
      <Bar data={data} options={options} />
    </Card>
  );
}
