/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
import { Container, TextField, Button, Grid, Stack } from "@mui/material";
import Notice from "./notice_preview";
import { useReactToPrint } from "react-to-print";
import { FormDataType } from "../../placement_company";
interface Props {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
}

const CompanyNotice = ({ formData, setFormData }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const reactToPrintFn = useReactToPrint({ contentRef });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      notice: {
        ...prev.notice,
        [name]: value,
      },
    }));
  };

  const onPrint = () => {
    reactToPrintFn();
  };

  return (
    <Container maxWidth="md">
      <Grid container spacing={3}>
        <Grid item xs={12}></Grid>
        <Grid item xs={12} sm={6}></Grid>
        <Grid item xs={12}>
          <TextField
            label="Subject"
            name="subject"
            value={formData.notice.subject}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Date"
            name="date"
            type="date"
            value={formData.notice.date}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Deadline"
            name="deadline"
            type="date"
            value={formData.notice.deadline}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Location"
            name="location"
            value={formData.notice.location}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Introduction"
            name="intro"
            value={formData.notice.intro}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="About"
            name="about"
            value={formData.notice.about}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Company Registration Link"
            name="company_registration_link"
            value={formData.notice.company_registration_link}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Note"
            name="note"
            value={formData.notice.note}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
      </Grid>
      {formData.notice && (
        <div>
          <Notice formData={formData as any} ref={contentRef} isPlacement />
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 3 }}
          >
            <Button
              variant="contained"
              color="primary"
              // startIcon={<PrintIcon />}
              onClick={onPrint}
              sx={{ px: 3, py: 1, fontWeight: "bold", borderRadius: "8px" }}
            >
              Print notice
            </Button>
          </Stack>
        </div>
      )}
    </Container>
  );
};

export default CompanyNotice;
