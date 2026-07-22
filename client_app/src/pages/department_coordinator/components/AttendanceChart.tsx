/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card } from "@/components/ui/card";
import { Doughnut } from "react-chartjs-2";
import "./Charts";

interface AttendanceChartProps {
  academicAttendance: Record<string, number>;
  trainingAttendance: Record<string, number>;
}

export function AttendanceChart({
  academicAttendance,
  trainingAttendance,
}: AttendanceChartProps) {
  const data = {
    labels: ["Academic Attendance", "Training Attendance"],
    datasets: [
      {
        data: [academicAttendance.FE, trainingAttendance.FE],
        backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(245, 158, 11, 0.8)"],
        borderColor: ["rgba(59, 130, 246, 1)", "rgba(245, 158, 11, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.label}: ${context.raw}%`,
        },
      },
    },
    cutout: "70%",
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
      <div className="relative aspect-square">
        <Doughnut data={data} options={options} />
      </div>
    </Card>
  );
}
