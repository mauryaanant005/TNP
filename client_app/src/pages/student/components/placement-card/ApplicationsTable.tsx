import { Table,TableRow,TableHeader,TableHead,TableCell,TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Circle,CheckCircle2 } from "lucide-react";

type Progress = {
  aptitude_test?: boolean;
  coding_test?: boolean;
  gd?: boolean;
  technical_interview?: boolean;
  hr_interview?: boolean;
  final_result: string;
};

type JobOffer = {
  role?: string;
};

type Application = {
  application_id: string | number;
  company_name: string;
  job_offer?: JobOffer;
  application_date: string;
  progress: Progress;
};

export function ApplicationsTable({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return <p className="text-center text-gray-500">No applications found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Company</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Date Applied</TableHead>
          <TableHead>Current Progress</TableHead>
          <TableHead className="text-right">Final Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((app) => (
          <TableRow key={app.application_id}>
            <TableCell className="font-medium">{app.company_name}</TableCell>
            <TableCell>{app.job_offer?.role || "N/A"}</TableCell>
            <TableCell>
              {new Date(app.application_date).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <ProgressSteps progress={app.progress} />
            </TableCell>
            <TableCell className="text-right">
              <Badge variant={app.progress.final_result === "Pending" ? "outline" : "default"}>
                {app.progress.final_result}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ProgressSteps({ progress }: { progress: Progress }) {
  const steps = [
    { name: "Aptitude", key: "aptitude_test" },
    { name: "Coding", key: "coding_test" },
    { name: "GD", key: "gd" },
    { name: "Tech", key: "technical_interview" },
    { name: "HR", key: "hr_interview" },
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {steps.map((step) => (
        <span
          key={step.key}
          className={`flex items-center text-xs p-1 rounded
            ${progress[step.key as keyof Progress]
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-500"
            }`}
        >
          {progress[step.key as keyof Progress] ? (
            <CheckCircle2 className="h-3 w-3 mr-1" />
          ) : (
            <Circle className="h-3 w-3 mr-1" />
          )}
          {step.name}
        </span>
      ))}
    </div>
  );
}