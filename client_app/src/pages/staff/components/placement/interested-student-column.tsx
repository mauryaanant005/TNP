"use client"; // Required for client components

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { InterestedStudentApplication } from "../../types/index";

export const interestedStudentColumns: ColumnDef<InterestedStudentApplication>[] =
  [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id:'uid',
      accessorKey: "student.uid",
      header: "UID",
    },
    {
      id: 'name',
      header: "Name",
      accessorKey: "student.full_name",
    },
    {
      id: 'email',
      accessorKey: "student.personal_email",
      header: "Email",
    },
    {
      id: 'department',
      accessorKey: "student.department",
      header: "Department",
    },
    {
      id: 'cgpa',
      accessorKey: "student.cgpa",
      header: "CGPA",
    },
    {
      id: 'aptitude_test',
      accessorKey: "progress.aptitude_test",
      header: "Aptitude",
      cell: ({ row }) => {
        const passed = row.original.progress.aptitude_test;
        return passed ? (
          <Badge variant="default">Passed</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        );
      },
    },
    {
      id: 'coding_test',
      accessorKey: "progress.coding_test",
      header: "Coding",
      cell: ({ row }) => {
        const passed = row.original.progress.coding_test;
        return passed ? (
          <Badge variant="default">Passed</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        );
      },
    },
    {
      id: 'group_discussion',
      accessorKey: "progress.gd",
      header: "Group Discussion",
      cell: ({ row }) => {
        const passed = row.original.progress.gd;
        return passed ? (
          <Badge variant="default">Passed</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        );
      },
    },
    {
      id: 'technical_interview',
      accessorKey: "progress.technical_interview",
      header: "Technical",
      cell: ({ row }) => {
        const passed = row.original.progress.technical_interview;
        return passed ? (
          <Badge variant="default">Passed</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        );
      },
    },
    {
      id: 'hr_interview',
      accessorKey: "progress.hr_interview",
      header: "HR",
      cell: ({ row }) => {
        const passed = row.original.progress.hr_interview;
        return passed ? (
          <Badge variant="default">Passed</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        );
      },
    },
    {
      id: 'final_result',
      accessorKey: "progress.final_result",
      header: "Final Result",
      cell: ({ row }) => {
        const result = row.original.progress.final_result;
        let variant: "default" | "destructive" | "outline" = "outline";
        if (result === "Selected") variant = "default";
        if (result === "Rejected") variant = "destructive";

        return <Badge variant={variant}>{result}</Badge>;
      },
    },
  ];