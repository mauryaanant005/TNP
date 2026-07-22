import {
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
} from "@mui/material";
import { Student } from "../FacultyAttendanceTable";

interface AttendanceTableProps {
  students: Student[];
  attendanceData: Record<string, any>;
  dateSession: string;
  onCheckboxChange: (
    studentId: string,
    batch: string,
    type: "Present" | "Late"
  ) => void;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AttendanceTable({
  students,
  attendanceData,
  dateSession,
  onCheckboxChange,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
}: AttendanceTableProps) {
  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "black" }}>
            <TableCell sx={{ fontWeight: "bold"}}>
              UID
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>
              Name
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>
              Batch
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              Present
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              Late
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => {
            const studentKey = `${student.student_data[0]}-${student.student_data[2]}-${dateSession}`;
            const attendance = attendanceData[studentKey] || {};
            return (
              <TableRow
                key={student.student_data[0]} // Use a stable, unique key
                sx={{
                  "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                  "&:hover": { bgcolor: "action.selected" },
                }}
              >
                <TableCell>{student.student_data[0]}</TableCell>
                <TableCell>{student.student_data[1]}</TableCell>
                <TableCell>{student.student_data[2]}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Mark as Present">
                    <Checkbox
                      checked={attendance.Present || false}
                      onChange={() =>
                        onCheckboxChange(
                          student.student_data[0],
                          student.student_data[2],
                          "Present"
                        )
                      }
                      color="success"
                    />
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Mark as Late">
                    <span>
                      <Checkbox
                        checked={attendance.Late || false}
                        disabled={!attendance.Present}
                        onChange={() =>
                          onCheckboxChange(
                            student.student_data[0],
                            student.student_data[2],
                            "Late"
                          )
                        }
                        color="warning"
                      />
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </TableContainer>
  );
}