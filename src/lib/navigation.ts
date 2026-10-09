export type PageInfo = { title: string; description: string; icon: string; phase: number; group: string; path: string };
export const navigation: PageInfo[] = [
{title:"Overview",description:"A clearer view of your work, from the first plan to the final decision.",icon:"overview",phase:1,group:"Workspace",path:""},
{title:"Projects",description:"Give every initiative a clear home, shared context, and a path forward.",icon:"projects",phase:2,group:"Workspace",path:"projects"},
{title:"Tasks",description:"Make the next step clear. Organize the work that moves your projects forward.",icon:"tasks",phase:2,group:"Workspace",path:"tasks"},
{title:"Team",description:"Bring people together with clear responsibilities and thoughtful access.",icon:"team",phase:2,group:"Workspace",path:"team"},
{title:"AI Insights",description:"Understand project risk and priorities with evidence you can inspect.",icon:"insights",phase:7,group:"Intelligence",path:"insights"},
{title:"Policy Studio",description:"Turn team intent into clear, reviewable project policies.",icon:"policies",phase:5,group:"Intelligence",path:"policies"},
{title:"Workflow History",description:"Follow the reasoning, decisions, and outcomes behind every workflow.",icon:"workflows",phase:5,group:"Intelligence",path:"workflows"},
{title:"What-If Simulations",description:"Explore a different plan before changing the one your team relies on.",icon:"simulations",phase:6,group:"Intelligence",path:"simulations"},
{title:"Approvals",description:"Make consequential changes deliberate, visible, and accountable.",icon:"approvals",phase:5,group:"Governance",path:"approvals"},
{title:"Audit Logs",description:"A traceable history of important actions across your organization.",icon:"audit",phase:9,group:"Governance",path:"audit"},
{title:"Notifications",description:"Keep relevant updates in one considered, distraction-free place.",icon:"notifications",phase:2,group:"Organization",path:"notifications"},
{title:"Organization Settings",description:"Shape your organization’s identity and workspace preferences.",icon:"settings",phase:2,group:"Organization",path:"settings"}
];
export const previewOrganizations = [{id:"preview",name:"Workspace preview",initials:"WP"},{id:"sandbox",name:"Second workspace",initials:"SW"}] as const;
export function organizationName(id:string){return previewOrganizations.find(o=>o.id===id)?.name ?? "Organization preview";}
export function workspaceHref(tenantId:string,path=""){return "/o/"+encodeURIComponent(tenantId)+(path?"/"+path:"");}
const projectTabs: Record<string,{title:string;icon:string;phase:number}> = {
tasks:{title:"Tasks",icon:"tasks",phase:2},milestones:{title:"Milestones",icon:"milestones",phase:2},
dependencies:{title:"Dependencies",icon:"dependencies",phase:2},team:{title:"Project Team",icon:"team",phase:2},
insights:{title:"AI Insights",icon:"insights",phase:7},policies:{title:"Policy Studio",icon:"policies",phase:5},
workflows:{title:"Workflow History",icon:"workflows",phase:5},simulations:{title:"What-If Simulations",icon:"simulations",phase:6},
proposals:{title:"Proposal Review",icon:"approvals",phase:5},assistant:{title:"Project Assistant",icon:"assistant",phase:8}
};
export function resolvePage(segments:string[]):PageInfo|null{
 const path=segments.join("/");
 if(segments.length<=1)return navigation.find(p=>p.path===path)??null;
 if(segments[0]!=="p"||!segments[1])return null;
 if(segments.length===2)return {title:"Project Overview",description:"A shared space for your project’s plan, people, and decisions.",icon:"projects",phase:2,group:"Project",path};
 const key=segments[2];const tab=projectTabs[key];if(!tab)return null;
 const tail=segments.slice(3);
 const valid=tail.length===0 ||
 (tail.length===1&&["tasks","workflows","simulations","proposals"].includes(key)) ||
 (key==="policies"&&tail.length===1) ||
 (key==="policies"&&tail.length===2&&["edit","versions"].includes(tail[1]));
 if(!valid)return null;
 return {title:tab.title,description:navigation.find(p=>p.path===key)?.description??"A focused view of the details that matter to your project.",icon:tab.icon,phase:tab.phase,group:"Project",path};
}
