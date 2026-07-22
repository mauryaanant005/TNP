import { Table,TableRow,TableHeader,TableHead,TableCell,TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Offer = {
  offer_id: string | number;
  company_name: string;
  role: string;
  salary: number;
  offer_type: string;
  offer_date: string;
  status: string;
};

export function OffersTable({ offers }: { offers: Offer[] }) {
  if (offers.length === 0) {
    return <p className="text-center text-gray-500">No offers received yet.</p>;
  }
  const formatSalary = (salary: number) => {
    return `₹${salary.toLocaleString('en-IN')}`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px]">Company</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Salary</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {offers.map((offer) => (
          <TableRow key={offer.offer_id}>
            <TableCell className="font-medium">{offer.company_name}</TableCell>
            <TableCell>{offer.role}</TableCell>
            <TableCell>{formatSalary(offer.salary)}</TableCell>
            <TableCell>{offer.offer_type}</TableCell>
            <TableCell>
              {new Date(offer.offer_date).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <OfferStatusBadge status={offer.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


function OfferStatusBadge({ status }: { status: string }) {
  let variant: "outline" | "default" | "secondary" | "destructive" | null | undefined = "outline";

  switch (status.toLowerCase()) {
    case "accepted":
    case "joined":
      variant = "default";
      break;
    case "offered":
      variant = "secondary";
      break;
    case "rejected":
      variant = "destructive";
      break;
    default:
      variant = "outline";
  }

  return <Badge variant={variant}>{status}</Badge>;
}