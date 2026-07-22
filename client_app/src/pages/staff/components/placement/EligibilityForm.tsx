// components/EligibilityForm.tsx
import { Grid, FormControlLabel, Checkbox } from "@mui/material";
import { FormDataType } from "../../placement_company";

interface Props {
  formData: FormDataType;
  handleChange: (e: any) => void;
}

const EligibilityForm = ({ formData, handleChange }: Props) => (
  <>
    <Grid item xs={12}>
      <FormControlLabel
        control={
          <Checkbox
            name="is_aedp_or_pli"
            checked={formData.is_aedp_or_pli}
            onChange={handleChange}
            color="primary"
          />
        }
        label="Offering AEDP / PLI"
      />
    </Grid>
    <Grid item xs={12}>
      <FormControlLabel
        control={
          <Checkbox
            name="is_aedp_or_ojt"
            checked={formData.is_aedp_or_ojt}
            onChange={handleChange}
            color="primary"
          />
        }
        label="Offering AEDP / OJT"
      />
    </Grid>
    <Grid item xs={12}>
      <FormControlLabel
        control={
          <Checkbox
            name="accepted_kt"
            checked={formData.accepted_kt}
            onChange={handleChange}
            color="primary"
          />
        }
        label="Accepting Active KT"
      />
    </Grid>
  </>
);

export default EligibilityForm;
