import { Bar } from "react-chartjs-2";
import { BranchData } from "../types";

interface Props {
  data: BranchData[];
}

export function BranchWiseChart({ data }: Props) {
  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: "Branch-wise Distribution",
        data: data.map((item) => item.value),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Branch-wise Internship Distribution",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Students",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
