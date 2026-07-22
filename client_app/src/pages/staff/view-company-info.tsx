import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InterestedStudentsTab } from "./components/placement/InterestedStudentTab";
import { useSearchParams } from "react-router";
import  NotInterestedStudentsTab  from "./components/placement/NotInterestedStudentsTab";
import EligibleStudentsTab  from "./components/placement/EligibleStudentsTab";

export default function ViewCompanyForm() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("id") || "";

  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="interested">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interested">Interested</TabsTrigger>
          <TabsTrigger value="not-interested">Not Interested</TabsTrigger>
          <TabsTrigger value="eligible">Eligible (Not Applied)</TabsTrigger>
        </TabsList>

        <TabsContent value="interested">
          <InterestedStudentsTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="not-interested">
          <NotInterestedStudentsTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="eligible">
          <EligibleStudentsTab companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}