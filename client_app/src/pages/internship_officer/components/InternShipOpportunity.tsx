import { Bar } from "react-chartjs-2";
import { InternshipOpportunity } from "../types";

interface Props {
  data: InternshipOpportunity[];
}

export function InternshipOpportunitiesChart({ data }: Props) {
  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: "Number of Internships",
        data: data.map((item) => item.value),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
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
        text: "Top Companies Offering Internships",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Opportunities",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
