import Link from "next/link";
import { ArrowUpRight, Layers3, LayoutDashboard, FolderKanban, CheckSquare2, Users, Sparkles, ScrollText, GitBranch, FlaskConical, ShieldCheck, Fingerprint, Bell, Settings2, Flag, Network, MessageSquare, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
const icons:Record<string,LucideIcon>={overview:LayoutDashboard,projects:FolderKanban,tasks:CheckSquare2,team:Users,insights:Sparkles,policies:ScrollText,workflows:GitBranch,simulations:FlaskConical,approvals:ShieldCheck,audit:Fingerprint,notifications:Bell,settings:Settings2,milestones:Flag,dependencies:Network,assistant:MessageSquare};
export function Icon({name,size=18,className=""}:{name:string;size?:number;className?:string}){const Glyph=icons[name]??Layers3;return <Glyph size={size} strokeWidth={1.7} aria-hidden="true" className={className}/>;}
export function Brand(){return <span className="brand"><span className="brand-mark"><Layers3 size={21} strokeWidth={2} aria-hidden="true"/></span><span>Project<span className="brand-os">OS</span></span></span>;}
export function Badge({children,tone="neutral"}:{children:ReactNode;tone?:"neutral"|"green"|"accent"}){return <span className={"badge "+tone}>{children}</span>;}
export function PageHeader({title,description,action}:{title:string;description:string;action?:ReactNode}){return <header className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</header>;}
export function Panel({children,className=""}:{children:ReactNode;className?:string}){return <section className={"panel "+className}>{children}</section>;}
export function TextLink({href,children}:{href:string;children:ReactNode}){return <Link href={href} className="text-link">{children}<ArrowUpRight size={16} aria-hidden="true"/></Link>;}
