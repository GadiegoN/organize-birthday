"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import {
  Home,
  Users,
  CheckSquare,
  DollarSign,
  Image as ImageIcon,
  Columns3Cog,
} from "lucide-react";

export default function EventLayout({ children }: { children: ReactNode }) {
  const { eventId } = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    {
      label: "Dashboard",
      href: `/events/${eventId}`,
      icon: <Home size={20} />,
    },
    {
      label: "Convidados",
      href: `/events/${eventId}/guests`,
      icon: <Users size={20} />,
    },
    {
      label: "Tarefas",
      href: `/events/${eventId}/tasks`,
      icon: <CheckSquare size={20} />,
    },
    {
      label: "Gastos",
      href: `/events/${eventId}/expenses`,
      icon: <DollarSign size={20} />,
    },
    {
      label: "Inspirações",
      href: `/events/${eventId}/references`,
      icon: <ImageIcon size={20} />,
    },
    {
      label: "Convite",
      href: `/events/${eventId}/invite-customization`,
      icon: <Columns3Cog size={20} />,
    },
    {
      label: "Usuários",
      href: `/events/${eventId}/access`,
      icon: <Columns3Cog size={20} />,
    },
  ];

  const mobileLinks = links.filter(
    (l) => l.label !== "Gastos" && l.label !== "Inspirações"
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside
        className="
        hidden 
        md:flex 
        flex-col 
        w-56 
        bg-slate-900 
        border-r 
        border-slate-800 
        p-4 
        space-y-4
      "
      >
        <h2 className="text-lg font-semibold px-2">Evento</h2>

        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-xl text-left
                  transition
                  ${
                    active ? "bg-sky-600/20 text-sky-400" : "hover:bg-slate-800"
                  }
                `}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>

      <nav
        className="
          md:hidden z-50
          fixed bottom-0 left-0 right-0
          bg-slate-900
          border-t border-slate-800
          flex justify-around
          py-2
        "
      >
        {mobileLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`
                flex flex-col items-center text-xs gap-1
                transition
                ${active ? "text-sky-400" : "text-slate-400"}
              `}
            >
              {link.icon}
              {link.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
