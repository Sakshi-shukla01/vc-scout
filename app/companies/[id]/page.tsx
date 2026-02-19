import CompanyProfileShellClient from "@/components/CompanyProfileShellClient";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CompanyProfileShellClient companyId={id} />;
}
