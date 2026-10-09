import { notFound } from "next/navigation";
import { resolvePage } from "@/lib/navigation";
import { Workspace } from "@/components/workspace";
export default async function Page({params}: {params: Promise<{tenantId:string;segments?:string[]}>}) { const {tenantId,segments=[]}=await params; const page=resolvePage(segments); if(!page) notFound(); return <Workspace tenantId={tenantId} segments={segments} page={page}/>; }
