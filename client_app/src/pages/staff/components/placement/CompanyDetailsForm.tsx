// components/CompanyDetailsForm.tsx
import { Grid, TextField } from "@mui/material";
import { FormDataType } from "../../placement_company";

interface Props {
  formData: FormDataType;
  handleChange: (e: any) => void;
}

const CompanyDetailsForm = ({ formData, handleChange }: Props) => (
  <>
    <Grid item xs={12}>
      <TextField
        name="name"
        label="Company Name"
        fullWidth
        required
        value={formData.name}
        onChange={handleChange}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        name="min_tenth_marks"
        label="Minimum 10th Marks"
        type="number"
        fullWidth
        required
        value={formData.min_tenth_marks}
        onChange={handleChange}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        name="min_higher_secondary_marks"
        label="Minimum 12th Marks"
        type="number"
        fullWidth
        required
        value={formData.min_higher_secondary_marks}
        onChange={handleChange}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        name="min_cgpa"
        label="Minimum CGPA"
        type="number"
        fullWidth
        required
        value={formData.min_cgpa}
        onChange={handleChange}
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        name="batch"
        label="Batch"
        type="text"
        fullWidth
        required
        value={formData.batch}
        onChange={handleChange}
      />
    </Grid>
  </>
);

export default CompanyDetailsForm;
