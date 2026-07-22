// components/JobOffersForm.tsx
import { Grid, Typography, TextField, Button } from "@mui/material";
import { FormDataType } from "../../placement_company";

interface Props {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
}

const JobOffersForm = ({ formData, setFormData }: Props) => {
  const handleJobOfferChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updatedJobOffers = [...formData.job_offers];
    updatedJobOffers[index] = {
      ...updatedJobOffers[index],
      [name as keyof (typeof updatedJobOffers)[typeof index]]: value,
    };
    setFormData({ ...formData, job_offers: updatedJobOffers });
  };

  const addJobOffer = () => {
    setFormData((prevData) => ({
      ...prevData,
      job_offers: [
        ...prevData.job_offers,
        { role: "", salary: "", skills: "" },
      ],
    }));
  };

  const removeJobOffer = (index: number) => {
    setFormData((prevData) => ({
      ...prevData,
      jobOffers:
        prevData.job_offers.length > 1
          ? prevData.job_offers.filter((_, i) => i !== index)
          : prevData.job_offers,
    }));
  };

  return (
    <Grid item xs={12}>
      <Typography variant="h6">Job Offers</Typography>
      {formData.job_offers.map((offer, index) => (
        <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <TextField
              name="role"
              label="Role"
              value={offer.role}
              onChange={(e) => handleJobOfferChange(index, e)}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              name="salary"
              label="Salary"
              type="number"
              value={offer.salary}
              onChange={(e) => handleJobOfferChange(index, e)}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              name="skills"
              label="Skills"
              value={offer.skills}
              onChange={(e) => handleJobOfferChange(index, e)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              onClick={() => removeJobOffer(index)}
              disabled={formData.job_offers.length === 1}
              color="error"
            >
              Remove
            </Button>
          </Grid>
        </Grid>
      ))}

      <Button onClick={addJobOffer} variant="contained" color="primary">
        Add Job Offer
      </Button>
    </Grid>
  );
};

export default JobOffersForm;
