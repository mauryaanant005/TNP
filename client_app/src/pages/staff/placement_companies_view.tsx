import { apiFetch, toList } from "@/lib/api";
import  { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Grid,
} from "@mui/material";
import { Plus, Eye, Pencil, Send } from "lucide-react"; // Lucide icons
import { useNavigate,  } from "react-router";

type Company = {
  id: string;
  name: string;
  batch: string;
};

const CompanyPage = () => {
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    apiFetch("/api/staff/companies/batches/") // Django endpoint for unique batches
      .then((res) => res.json())
      .then((data) => setBatches(toList<string>(data)))
      .catch((err) => console.error("Error fetching batches:", err));
  }, []);

  // Fetch companies for selected batch
  useEffect(() => {
    if (selectedBatch) {
      apiFetch(`/api/staff/placement/companies/batch/${selectedBatch}/`)
        .then((res) => res.json())
        .then((data) => setCompanies(toList<Company>(data)))
        .catch((err) => console.error("Error fetching companies:", err));
    }
  }, [selectedBatch]);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Company Management
      </Typography>

      {/* Batch Dropdown + Add Company */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <Select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          displayEmpty
          sx={{ mr: 2, minWidth: 200 }}
        >
          <MenuItem value="">Select Batch</MenuItem>
          {batches.map((batch) => (
            <MenuItem key={batch} value={batch}>
              {batch}
            </MenuItem>
          ))}
        </Select>

        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => navigate("/staff/placement_companies/register")}

        >
          Add Company
        </Button>
      </div>

      {/* Companies List */}
      <Grid container spacing={2}>
        {companies.map((company) => (
          <Grid item xs={12} md={6} lg={4} key={company.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{company.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Batch: {company.batch}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => navigate(`/staff/placement_companies/view/?id=${company.id}`)}>
                  <Eye size={18} />
                </IconButton>
                <IconButton onClick={() => navigate(`/staff/placement_companies/message/?id=${company.id}`)}>
                  <Send size={18} />
                </IconButton>
                <IconButton onClick={() => navigate(`/staff/placement_companies/edit/?id=${company.id}`)}>
                  <Pencil size={18} />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default CompanyPage;
