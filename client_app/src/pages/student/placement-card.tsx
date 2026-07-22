import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle,  } from "lucide-react";
import { ApplicationsTable } from './components/placement-card/ApplicationsTable';
import { OffersTable } from './components/placement-card/OffersTable';
export default function PlacementCard() {
  const [data, setData] = useState({ applications: [], offers: [], academic_year: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/student/placement-card/", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized: Invalid or expired token. Please log in again.");
          }
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();

        setData(result);

      } catch (err:any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (data.academic_year != 'BE') return (
    <div className='md:mx-[40dvw]'>
    <Alert variant={'destructive'} >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Access Restricted</AlertTitle>
      <AlertDescription>
        Placement Card is only available for BE students.
      </AlertDescription>
    </Alert>
    </div>
  )
  return (
    <div className="w-[100dvw] flex justify-center p-4 md:p-8 ">

      <Tabs defaultValue="applications" className='w-full md:w-2/3'>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">
            My Applications ({data.applications.length})
          </TabsTrigger>
          <TabsTrigger value="offers">
            My Offers ({data.offers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>
                All companies you have applied to and your current progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationsTable applications={data.applications} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          <Card>
            <CardHeader>
              <CardTitle>My Offers</CardTitle>
              <CardDescription>
                All offers you have received from companies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OffersTable offers={data.offers} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


