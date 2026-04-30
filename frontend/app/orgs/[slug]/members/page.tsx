import { notFound } from "next/navigation";
import {
  listMembers,
  listOrgs,
  type Member,
  type Organization,
} from "@/lib/api";
import MembersPanel from "./members-panel";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function OrgMembersPage({ params }: PageProps) {
  const { slug } = await params;

  let orgs: Organization[] = [];
  try {
    orgs = await listOrgs();
  } catch {
    orgs = [];
  }
  const org = orgs.find((o) => o.slug === slug);
  if (!org) notFound();

  let members: Member[] = [];
  let error: string | null = null;
  try {
    members = await listMembers(org.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Üyeler alınamadı.";
  }

  return (
    <MembersPanel
      org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: org.role,
      }}
      initialMembers={members}
      initialError={error}
    />
  );
}
